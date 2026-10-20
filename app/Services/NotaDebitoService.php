<?php

namespace App\Services;

use App\Models\Comprobante;
use App\Models\Emisor;
use App\Services\Sri\SignatureService;
use App\Services\Sri\SriService;
use App\Services\Xml\XmlNotaDebitoBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class NotaDebitoService
{
    public function __construct(
        protected SriService $sriService,
        protected SignatureService $signatureService,
        protected XmlNotaDebitoBuilder $xmlBuilder
    ) {}

    public function crear(array $data): Comprobante
    {
        $comprobante = DB::transaction(function () use ($data) {
            $emisor = Emisor::findOrFail($data['emisor_id']);
            $facturaOrigen = Comprobante::find($data['comprobante_id'] ?? null);

            $establecimiento = $emisor->codigo_establecimiento ?? $emisor->establecimiento ?? $facturaOrigen?->establecimiento ?? '001';
            $puntoEmision = $emisor->punto_emision ?? $facturaOrigen?->punto_emision ?? '001';

            $ultimoSecuencial = Comprobante::where('emisor_id', $emisor->id)
                ->where('establecimiento', $establecimiento)
                ->where('punto_emision', $puntoEmision)
                ->where('tipo_comprobante', '05')
                ->lockForUpdate()
                ->max('secuencial');

            $secuencial = str_pad(((int) $ultimoSecuencial) + 1, 9, '0', STR_PAD_LEFT);
            $fechaEmision = $data['fecha_emision'] ?? now()->toDateString();

            $fechaFormateada = Carbon::parse($fechaEmision)->format('dmY');
            $codigoNumerico = str_pad((string) random_int(1, 99999999), 8, '0', STR_PAD_LEFT);

            $claveAcceso = $this->sriService->generarClaveAcceso(
                $fechaFormateada,
                '05',
                $emisor->ruc,
                (string) ($emisor->ambiente ?? '1'),
                $establecimiento,
                $puntoEmision,
                $secuencial,
                $codigoNumerico
            );

            $subtotal = array_reduce($data['motivos'], fn($acc, $m) => $acc + (float)$m['valor'], 0.0);
            $porcentajeIva = (float) ($data['porcentaje_iva'] ?? 15);
            $montoIva = $subtotal * ($porcentajeIva / 100);
            $total = $subtotal + $montoIva;

            $subtotal15 = ($porcentajeIva == 15) ? $subtotal : 0.0;
            $subtotal0  = ($porcentajeIva == 0)  ? $subtotal : 0.0;

            $comprobante = Comprobante::create([
                'emisor_id' => $emisor->id,
                'cliente_id' => $data['cliente_id'],
                'comprobante_modificado_id' => $data['comprobante_id'] ?? null,
                'tipo_comprobante' => '05',
                'establecimiento' => $establecimiento,
                'punto_emision' => $puntoEmision,
                'secuencial' => $secuencial,
                'clave_acceso' => $claveAcceso,
                'fecha_emision' => $fechaEmision,
                'total_sin_impuestos' => $subtotal,
                'subtotal_15' => $subtotal15,
                'subtotal_0' => $subtotal0,
                'monto_iva' => $montoIva,
                'importe_total' => $total,
                'estado_sri' => 'PENDIENTE',
            ]);

            foreach ($data['motivos'] as $motivo) {
                $comprobante->motivos()->create([
                    'razon' => $motivo['razon'],
                    'valor' => $motivo['valor'],
                ]);
            }

            return $comprobante;
        });

        $this->procesarSri($comprobante);

        return $comprobante;
    }

    public function procesarSri(Comprobante $comprobante): void
    {
        try {
            $emisor = $comprobante->emisor;

            $p12Relativo = $emisor->p12_path ?? $emisor->firma_p12_path ?? $emisor->firma_path;
            if (! $p12Relativo) {
                throw new \Exception('El emisor no tiene configurada la ruta del archivo de firma digital (.p12).');
            }

            $p12Fullpath = match (true) {
                file_exists($p12Relativo) => $p12Relativo,
                file_exists(storage_path('app/' . $p12Relativo)) => storage_path('app/' . $p12Relativo),
                file_exists(storage_path('app/private/' . $p12Relativo)) => storage_path('app/private/' . $p12Relativo),
                default => null,
            };

            if (! $p12Fullpath) {
                throw new \Exception("No se encontró el archivo .p12 en storage: {$p12Relativo}");
            }

            $p12Password = $emisor->clave_p12;
            if (empty($p12Password)) {
                throw new \Exception('La contraseña de la firma .p12 está vacía.');
            }

            // 1. Generar XML sin firmar y guardar en disco
            $xmlString = $this->xmlBuilder->build($comprobante);
            $relXmlGenerado = "sri/xml_generados/{$comprobante->clave_acceso}.xml";
            Storage::put($relXmlGenerado, $xmlString);

            // 2. Firmar XML y guardar en disco
            $xmlFirmado = $this->signatureService->firmarXml($xmlString, $p12Fullpath, $p12Password);
            $relXmlFirmado = "sri/xml_firmados/{$comprobante->clave_acceso}_firmado.xml";
            Storage::put($relXmlFirmado, $xmlFirmado);

            // Guardar rutas físicas en la base de datos
            $comprobante->update([
                'xml_generado_path' => $relXmlGenerado,
                'xml_firmado_path' => $relXmlFirmado,
            ]);

            // 3. Transmitir a Recepción SRI
            $resRecepcion = $this->sriService->enviarComprobante($xmlFirmado, (string) ($emisor->ambiente ?? '1'));

            if ($resRecepcion['estado'] === 'RECIBIDA') {
                $resAutorizacion = $this->sriService->autorizarComprobante($comprobante->clave_acceso, (string) ($emisor->ambiente ?? '1'));

                $comprobante->update([
                    'estado_sri' => $resAutorizacion['estado'],
                    'fecha_autorizacion' => $resAutorizacion['fechaAutorizacion'] ?? null,
                    'mensajes_sri' => json_encode($resAutorizacion['errores'] ?? []),
                ]);
            } else {
                $comprobante->update([
                    'estado_sri' => 'DEVUELTA',
                    'mensajes_sri' => json_encode($resRecepcion['errores'] ?? []),
                ]);
            }
        } catch (\Exception $e) {
            $comprobante->update([
                'estado_sri' => 'ERROR',
                'mensajes_sri' => json_encode([$e->getMessage()]),
            ]);
        }
    }
}