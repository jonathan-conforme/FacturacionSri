<?php

namespace App\Services;

use App\Models\Comprobante;
use App\Models\Emisor;
use App\Models\ImpuestoTarifa;
use App\Services\Sri\SignatureService;
use App\Services\Sri\SriService;
use App\Services\Xml\XmlFacturaBuilder;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FacturaService
{
    public function __construct(
        protected SriService $sriService,
        protected XmlFacturaBuilder $xmlBuilder,
        protected SignatureService $signatureService
    ) {}

    public function crearYProcesarFactura(array $data): Comprobante
    {
        return DB::transaction(function () use ($data) {
            $emisor = Emisor::firstOrFail();

            // 1. Calcular totales
            $subtotal15 = 0;
            $subtotal0 = 0;
            $montoIva = 0;
            $totalSinImpuestos = 0;

            $itemsProcesados = [];

            foreach ($data['items'] as $item) {
                $tarifaObj = ImpuestoTarifa::where('codigo_porcentaje', $item['codigo_porcentaje'])->firstOrFail();

                $precioUnitario = $item['precio_unitario'];
                $cantidad = $item['cantidad'];
                $descuento = $item['descuento'] ?? 0;

                $precioTotalSinImpuesto = ($precioUnitario * $cantidad) - $descuento;
                $valorImpuesto = round($precioTotalSinImpuesto * ($tarifaObj->porcentaje / 100), 2);

                $totalSinImpuestos += $precioTotalSinImpuesto;

                if ($tarifaObj->porcentaje > 0) {
                    $subtotal15 += $precioTotalSinImpuesto;
                    $montoIva += $valorImpuesto;
                } else {
                    $subtotal0 += $precioTotalSinImpuesto;
                }

                $itemsProcesados[] = array_merge($item, [
                    'codigo_impuesto' => $tarifaObj->codigo_impuesto,
                    'tarifa' => $tarifaObj->porcentaje,
                    'precio_total_sin_impuesto' => $precioTotalSinImpuesto,
                    'base_imponible' => $precioTotalSinImpuesto,
                    'valor_impuesto' => $valorImpuesto,
                ]);
            }

            $propina = $data['propina'] ?? 0;
            $importeTotal = $totalSinImpuestos + $montoIva + $propina;

            // 2. Preparar correlativo y fecha
            $secuencialNum = Comprobante::where('emisor_id', $emisor->id)->count() + 1;
            $secuencial = str_pad($secuencialNum, 9, '0', STR_PAD_LEFT);

            $fechaEmision = Carbon::parse($data['fecha_emision']); // Convertimos a Carbon de forma segura
            $fechaFormateadaSRI = $fechaEmision->format('dmY');   // ddmmaaaa (Ej: 28092026)

            // 3. Generar la Clave de Acceso ANTES de crear el registro
            $claveAcceso = $this->sriService->generarClaveAcceso(
                $fechaFormateadaSRI,
                '01', // Tipo Factura
                $emisor->ruc,
                $emisor->ambiente,
                $emisor->codigo_establecimiento,
                $emisor->punto_emision,
                $secuencial,
                str_pad((string) rand(1, 99999999), 8, '0', STR_PAD_LEFT)
            );

            // 4. Crear el registro del Comprobante (con la clave de acceso ya disponible)
            $comprobante = Comprobante::create([
                'emisor_id' => $emisor->id,
                'cliente_id' => $data['cliente_id'],
                'tipo_comprobante' => '01',
                'establecimiento' => $emisor->codigo_establecimiento,
                'punto_emision' => $emisor->punto_emision,
                'secuencial' => $secuencial,
                'clave_acceso' => $claveAcceso,
                'fecha_emision' => $fechaEmision,
                'total_sin_impuestos' => $totalSinImpuestos,
                'subtotal_15' => $subtotal15,
                'subtotal_0' => $subtotal0,
                'monto_iva' => $montoIva,
                'propina' => $propina,
                'importe_total' => $importeTotal,
                'estado_sri' => 'CREADO',
            ]);

            // 5. Guardar los detalles del comprobante
            foreach ($itemsProcesados as $det) {
                $comprobante->detalles()->create($det);
            }

            // 6. Generar XML y guardar en Storage
            $xmlString = $this->xmlBuilder->generarXml($comprobante);
            $xmlPath = "sri/xml_generados/{$claveAcceso}.xml";
            Storage::put($xmlPath, $xmlString);

            // 7. FIRMA DIGITAL XAdES-BES
            $p12AbsolutePath = Storage::path($emisor->p12_path);
            $p12Password = decrypt($emisor->p12_password);

            if (! file_exists($p12AbsolutePath)) {
                throw new Exception("El certificado .p12 no existe en la ruta configurada: {$p12AbsolutePath}");
            }

            // Cambiamos el nombre aquí a $xmlFirmado
            $xmlFirmado = $this->signatureService->firmarXml(
                $xmlString,
                $p12AbsolutePath,
                $p12Password
            );

            $xmlFirmadoPath = "sri/xml_firmados/{$claveAcceso}_firmado.xml";
            Storage::put($xmlFirmadoPath, $xmlFirmado);

            $comprobante->update([
                'xml_generado_path' => $xmlPath,
                'xml_firmado_path' => $xmlFirmadoPath,
            ]);

            // 8. Enviar a Recepción del SRI (Se pasa en Base64)
           $resRecepcion = $this->sriService->enviarComprobante($xmlFirmado, $emisor->ambiente);
            if ($resRecepcion['estado'] !== 'RECIBIDA') {
                $comprobante->update([
                    'estado_sri' => 'DEVUELTA',
                    'mensajes_sri' => json_encode($resRecepcion['errores'], JSON_UNESCAPED_UNICODE),
                ]);

                return $comprobante;
            }

            // 9. Consultar Autorización en el SRI
            $resAutorizacion = $this->sriService->autorizarComprobante($claveAcceso, $emisor->ambiente);

            $comprobante->update([
                'estado_sri' => $resAutorizacion['estado'],
               
                'fecha_autorizacion' => $resAutorizacion['fechaAutorizacion'] ?? null,
                'mensajes_sri' => json_encode($resAutorizacion['errores'] ?? [], JSON_UNESCAPED_UNICODE),
            ]);

            return $comprobante;
        });
    }
}
