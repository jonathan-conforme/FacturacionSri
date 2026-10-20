<?php
namespace App\Services;

use App\Models\Comprobante;
use App\Models\Emisor;
use App\Services\Sri\SignatureService;
use App\Services\Sri\SriService;
use App\Services\Xml\XmlRetencionBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RetencionService
{
    public function __construct(
        protected SriService $sriService,
        protected SignatureService $signatureService,
        protected XmlRetencionBuilder $xmlBuilder
    ) {}

    public function crear(array $data): Comprobante
    {
        $comprobante = DB::transaction(function () use ($data) {
            $emisor = Emisor::findOrFail($data['emisor_id']);

          $establecimiento = $emisor->codigo_establecimiento
    ?? $emisor->establecimiento
    ?? $data['establecimiento']
    ?? '001';

$puntoEmision = $emisor->punto_emision
    ?? $data['punto_emision']
    ?? '001';
            $ultimoSecuencial = Comprobante::where('emisor_id', $emisor->id)
                ->where('establecimiento', $establecimiento)
                ->where('punto_emision', $puntoEmision)
                ->where('tipo_comprobante', '07')
                ->lockForUpdate()
                ->max('secuencial');

            $secuencial = str_pad(((int) $ultimoSecuencial) + 1, 9, '0', STR_PAD_LEFT);
            $fechaEmision = $data['fecha_emision'] ?? now()->toDateString();
            $periodoFiscal = $data['periodo_fiscal'] ?? Carbon::parse($fechaEmision)->format('m/Y');

            $fechaFormateada = Carbon::parse($fechaEmision)->format('dmY');
            $codigoNumerico = str_pad((string) random_int(1, 99999999), 8, '0', STR_PAD_LEFT);

            // Generación de la Clave de Acceso (Tipo 07)
            $claveAcceso = $this->sriService->generarClaveAcceso(
                $fechaFormateada,
                '07',
                $emisor->ruc,
                (string) ($emisor->ambiente ?? '1'),
                $establecimiento,
                $puntoEmision,
                $secuencial,
                $codigoNumerico
            );

            // Cálculos de Totales
            $totalBaseImponible = array_reduce($data['detalles'], fn($acc, $d) => $acc + (float)$d['base_imponible'], 0.0);
            $totalRetenido = array_reduce($data['detalles'], function ($acc, $d) {
                $valor = isset($d['valor_retenido'])
                    ? (float)$d['valor_retenido']
                    : round((float)$d['base_imponible'] * ((float)$d['porcentaje_retener'] / 100), 2);
                return $acc + $valor;
            }, 0.0);

            $comprobante = Comprobante::create([
                'emisor_id' => $emisor->id,
                'cliente_id' => $data['cliente_id'], // Sujeto retenido
                'tipo_comprobante' => '07',
                'establecimiento' => $establecimiento,
                'punto_emision' => $puntoEmision,
                'secuencial' => $secuencial,
                'clave_acceso' => $claveAcceso,
                'fecha_emision' => $fechaEmision,
                'periodo_fiscal' => $periodoFiscal,
                'total_sin_impuestos' => $totalBaseImponible,
                'subtotal_15' => 0.00,
                'subtotal_0' => 0.00,
                'monto_iva' => 0.00,
                'importe_total' => $totalRetenido,
                'estado_sri' => 'PENDIENTE',
            ]);

            foreach ($data['detalles'] as $detalle) {
                $valorRet = round(((float)$detalle['base_imponible'] * (float)$detalle['porcentaje_retener']) / 100, 2);

                $comprobante->retencionDetalles()->create([
                    'cod_sustento' => $detalle['cod_sustento'] ?? '01',
                    'cod_doc_sustento' => $detalle['cod_doc_sustento'] ?? '01',
                    'num_doc_sustento' => $detalle['num_doc_sustento'],
                    'fecha_emision_doc_sustento' => $detalle['fecha_emision_doc_sustento'],
                    'codigo_impuesto' => $detalle['codigo_impuesto'],
                    'codigo_retencion' => $detalle['codigo_retencion'],
                    'base_imponible' => $detalle['base_imponible'],
                    'porcentaje_retener' => $detalle['porcentaje_retener'],
                    'valor_retenido' => $valorRet,
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

            // 2. Firmar XML mediante SignatureService
            $xmlFirmado = $this->signatureService->firmarXml($xmlString, $p12Fullpath, $p12Password);
            $relXmlFirmado = "sri/xml_firmados/{$comprobante->clave_acceso}_firmado.xml";
            Storage::put($relXmlFirmado, $xmlFirmado);

            $comprobante->update([
                'xml_generado_path' => $relXmlGenerado,
                'xml_firmado_path' => $relXmlFirmado,
            ]);

            // 3. Transmitir al SOAP SRI
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
