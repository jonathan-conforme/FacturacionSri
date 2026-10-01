<?php

namespace App\Services;

use App\Models\Comprobante;
use App\Models\Emisor;
use App\Services\Sri\SignatureService;
use App\Services\Sri\SriService;
use App\Services\Xml\XmlNotaCreditoBuilder;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class NotaCreditoService
{
    public function __construct(
        protected SriService $sriService,
        protected XmlNotaCreditoBuilder $xmlBuilder,
        protected SignatureService $signatureService
    ) {}

    /**
     * Crea la nota de crédito, la firma y la envía al SRI.
     * El registro se guarda en una transacción corta; el envío al SRI va
     * fuera de ella para no revertir un comprobante que el SRI ya recibió.
     */
    public function crearYProcesar(array $data): Comprobante
    {
        $nc = DB::transaction(fn () => $this->crearRegistro($data));

        return $this->firmarYEnviar($nc);
    }

    // ------------------------------------------------------------------
    // 1. Crear registro y calcular totales
    // ------------------------------------------------------------------
    protected function crearRegistro(array $data): Comprobante
    {
        $emisor = Emisor::firstOrFail();
        $factura = Comprobante::with('detalles')->findOrFail($data['comprobante_id']);

        if ($factura->tipo_comprobante !== '01') {
            $this->fallo('comprobante_id', 'Solo se puede emitir una nota de crédito sobre una factura.');
        }

        // En producción la factura debe estar autorizada. En pruebas se permite
        // para poder desarrollar; el SRI igual validará el documento.
        if ($emisor->ambiente === '2' && $factura->estado_sri !== 'AUTORIZADO') {
            $this->fallo('comprobante_id', 'La factura debe estar AUTORIZADA para emitir una nota de crédito.');
        }

        $fechaEmision = Carbon::parse($data['fecha_emision']);

        if ($fechaEmision->lt(Carbon::parse($factura->fecha_emision)->startOfDay())) {
            $this->fallo('fecha_emision', 'La fecha no puede ser anterior a la de la factura.');
        }

        // Líneas solicitadas (si no se envían, se acredita la factura completa)
        $solicitados = collect($data['items'] ?? [])->keyBy('detalle_id');

        if ($solicitados->keys()->diff($factura->detalles->pluck('id'))->isNotEmpty()) {
            $this->fallo('items', 'Alguna línea no pertenece a la factura indicada.');
        }

        $lineas = [];
        $totalSinImpuestos = 0;
        $subtotal15 = 0;
        $subtotal0 = 0;
        $montoIva = 0;

        foreach ($factura->detalles as $det) {
            if ($solicitados->isNotEmpty()) {
                if (! $solicitados->has($det->id)) {
                    continue;
                }
                $cantidad = (float) $solicitados[$det->id]['cantidad'];
            } else {
                $cantidad = (float) $det->cantidad;
            }

            if ($cantidad > (float) $det->cantidad + 0.000001) {
                $this->fallo('items', "La cantidad de «{$det->descripcion}» supera la facturada.");
            }

            $ratio = $cantidad / (float) $det->cantidad;

            if (abs($ratio - 1) < 1e-9) {
                // Acreditación total de la línea: se copian los valores tal cual
                $descuento = (float) $det->descuento;
                $base = (float) $det->precio_total_sin_impuesto;
                $valorImpuesto = (float) $det->valor_impuesto;
            } else {
                $descuento = round((float) $det->descuento * $ratio, 2);
                $base = round(((float) $det->precio_unitario * $cantidad) - $descuento, 2);
                $valorImpuesto = round($base * ((float) $det->tarifa / 100), 2);
            }

            $totalSinImpuestos += $base;

            if ((float) $det->tarifa > 0) {
                $subtotal15 += $base;
                $montoIva += $valorImpuesto;
            } else {
                $subtotal0 += $base;
            }

            $lineas[] = [
                'codigo_principal' => $det->codigo_principal,
                'codigo_auxiliar' => $det->codigo_auxiliar,
                'descripcion' => $det->descripcion,
                'cantidad' => $cantidad,
                'precio_unitario' => $det->precio_unitario,
                'descuento' => $descuento,
                'precio_total_sin_impuesto' => $base,
                'codigo_impuesto' => $det->codigo_impuesto,
                'codigo_porcentaje' => $det->codigo_porcentaje,
                'tarifa' => $det->tarifa,
                'base_imponible' => $base,
                'valor_impuesto' => $valorImpuesto,
            ];
        }

        $totalSinImpuestos = round($totalSinImpuestos, 2);
        $subtotal15 = round($subtotal15, 2);
        $subtotal0 = round($subtotal0, 2);
        $montoIva = round($montoIva, 2);
        $importeTotal = round($totalSinImpuestos + $montoIva, 2);

        // No se puede acreditar más de lo facturado
        $yaAcreditado = (float) Comprobante::where('comprobante_modificado_id', $factura->id)
            ->where('tipo_comprobante', '04')
            ->whereNotIn('estado_sri', ['DEVUELTA', 'NO AUTORIZADO', 'RECHAZADO', 'ERROR'])
            ->sum('importe_total');

        if ($yaAcreditado + $importeTotal > (float) $factura->importe_total + 0.01) {
            $this->fallo('items', sprintf(
                'El total de notas de crédito (%.2f) superaría el de la factura (%.2f).',
                $yaAcreditado + $importeTotal,
                $factura->importe_total
            ));
        }

        // Secuencial propio de las notas de crédito (no se mezcla con facturas)
        $ultimo = Comprobante::where('emisor_id', $emisor->id)
            ->where('tipo_comprobante', '04')
            ->where('establecimiento', $emisor->codigo_establecimiento)
            ->where('punto_emision', $emisor->punto_emision)
            ->lockForUpdate()
            ->max('secuencial');

        $secuencial = str_pad((string) (((int) $ultimo) + 1), 9, '0', STR_PAD_LEFT);

        $claveAcceso = $this->sriService->generarClaveAcceso(
            $fechaEmision->format('dmY'),
            '04',
            $emisor->ruc,
            $emisor->ambiente,
            $emisor->codigo_establecimiento,
            $emisor->punto_emision,
            $secuencial,
            str_pad((string) random_int(1, 99999999), 8, '0', STR_PAD_LEFT)
        );

        $nc = Comprobante::create([
            'emisor_id' => $emisor->id,
            'cliente_id' => $factura->cliente_id,
            'comprobante_modificado_id' => $factura->id,
            'tipo_comprobante' => '04',
            'establecimiento' => $emisor->codigo_establecimiento,
            'punto_emision' => $emisor->punto_emision,
            'secuencial' => $secuencial,
            'clave_acceso' => $claveAcceso,
            'fecha_emision' => $fechaEmision,
            'total_sin_impuestos' => $totalSinImpuestos,
            'subtotal_15' => $subtotal15,
            'subtotal_0' => $subtotal0,
            'monto_iva' => $montoIva,
            'propina' => 0,
            'importe_total' => $importeTotal,
            'motivo' => $data['motivo'],
            'estado_sri' => 'CREADO',
        ]);

        foreach ($lineas as $linea) {
            $nc->detalles()->create($linea);
        }

        return $nc;
    }

    // ------------------------------------------------------------------
    // 2. Generar XML, firmar y enviar
    // ------------------------------------------------------------------
    protected function firmarYEnviar(Comprobante $nc): Comprobante
    {
        $emisor = $nc->emisor;
        $password = null;

        try {
            $xml = $this->xmlBuilder->generarXml($nc);
            $xmlPath = "sri/xml_generados/{$nc->clave_acceso}.xml";
            Storage::put($xmlPath, $xml);

            $p12Path = Storage::path($emisor->p12_path);

            if (! file_exists($p12Path)) {
                throw new Exception('El certificado .p12 no existe en la ruta configurada.');
            }

            $password = decrypt($emisor->p12_password);

            $xmlFirmado = $this->signatureService->firmarXml($xml, $p12Path, $password);
            $xmlFirmadoPath = "sri/xml_firmados/{$nc->clave_acceso}_firmado.xml";
            Storage::put($xmlFirmadoPath, $xmlFirmado);

            $nc->update([
                'xml_generado_path' => $xmlPath,
                'xml_firmado_path' => $xmlFirmadoPath,
            ]);

            // Recepción (el XML va sin base64: SoapClient ya lo codifica)
            $recepcion = $this->sriService->enviarComprobante($xmlFirmado, $emisor->ambiente);

            if ($recepcion['estado'] !== 'RECIBIDA') {
                $nc->update([
                    'estado_sri' => 'DEVUELTA',
                    'mensajes_sri' => json_encode($recepcion['errores'], JSON_UNESCAPED_UNICODE),
                ]);

                return $nc;
            }

            // Autorización: el SRI a veces tarda unos segundos, se reintenta
            $autorizacion = null;
            for ($intento = 1; $intento <= 3; $intento++) {
                $autorizacion = $this->sriService->autorizarComprobante($nc->clave_acceso, $emisor->ambiente);

                $sinRespuesta = str_starts_with($autorizacion['errores'][0] ?? '', 'Sin respuesta');
                if (! $sinRespuesta) {
                    break;
                }
                sleep(2);
            }

            $nc->update([
                'estado_sri' => $autorizacion['estado'],
                'fecha_autorizacion' => isset($autorizacion['fechaAutorizacion'])
                    ? Carbon::parse($autorizacion['fechaAutorizacion'])
                        ->setTimezone(config('app.timezone'))
                        ->toDateTimeString()
                    : null,
                'mensajes_sri' => json_encode($autorizacion['errores'] ?? [], JSON_UNESCAPED_UNICODE),
            ]);
        } catch (Throwable $e) {
            // ProcessFailedException incluye el comando completo (con la contraseña del .p12)
            $mensaje = $password ? str_replace($password, '********', $e->getMessage()) : $e->getMessage();

            $nc->update([
                'estado_sri' => 'ERROR',
                'mensajes_sri' => json_encode([$mensaje], JSON_UNESCAPED_UNICODE),
            ]);
        }

        return $nc;
    }

    private function fallo(string $campo, string $mensaje): never
    {
        throw ValidationException::withMessages([$campo => $mensaje]);
    }
}
