<?php

namespace App\Services;

use App\Models\GuiaRemision;
use App\Services\Sri\SignatureService;
use App\Services\Sri\SriService;
use App\Services\Xml\XmlGuiaRemisionBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GuiaRemisionService
{
    public function __construct(
        protected XmlGuiaRemisionBuilder $xmlBuilder,
        protected SignatureService $signatureService,
        protected SriService $sriService
    ) {}

   public function crearGuia(array $data): GuiaRemision
    {
        return DB::transaction(function () use ($data) {
            // Calcular automáticamente el siguiente secuencial correlativo
            $ultimoSecuencial = GuiaRemision::where('emisor_id', $data['emisor_id'])
                ->where('establecimiento', $data['establecimiento'])
                ->where('punto_emision', $data['punto_emision'])
                ->lockForUpdate()
                ->max('secuencial');

            $siguienteSecuencial = str_pad(((int) $ultimoSecuencial) + 1, 9, '0', STR_PAD_LEFT);

            $guia = GuiaRemision::create([
                'emisor_id' => $data['emisor_id'],
                'cliente_id' => $data['cliente_id'],
                'comprobante_id' => $data['comprobante_id'] ?? null,
                'establecimiento' => $data['establecimiento'],
                'punto_emision' => $data['punto_emision'],
                'secuencial' => $siguienteSecuencial, // Asigna el correlativo automático
                'fecha_emision' => $data['fecha_emision'],
                'dir_partida' => $data['dir_partida'],
                'tipo_identificacion_transportista' => $data['tipo_identificacion_transportista'],
                'identificacion_transportista' => $data['identificacion_transportista'],
                'razon_social_transportista' => $data['razon_social_transportista'],
                'placa' => $data['placa'],
                'fecha_inicio_transporte' => $data['fecha_inicio_transporte'],
                'fecha_fin_transporte' => $data['fecha_fin_transporte'],
                'dir_destinatario' => $data['dir_destinatario'],
                'motivo_traslado' => $data['motivo_traslado'],
                'ruta' => $data['ruta'] ?? null,
                'cod_doc_sustento' => $data['cod_doc_sustento'] ?? '01',
                'num_doc_sustento' => $data['num_doc_sustento'] ?? null,
                'num_aut_doc_sustento' => $data['num_aut_doc_sustento'] ?? null,
                'fecha_emision_doc_sustento' => $data['fecha_emision_doc_sustento'] ?? null,
                'estado_sri' => 'CREADO',
            ]);

            foreach ($data['detalles'] as $detalle) {
                $guia->detalles()->create([
                    'codigo_interno' => $detalle['codigo_interno'],
                    'codigo_adicional' => $detalle['codigo_adicional'] ?? null,
                    'descripcion' => $detalle['descripcion'],
                    'cantidad' => $detalle['cantidad'],
                ]);
            }

            return $guia;
        });
    }

    public function procesarSri(GuiaRemision $guia): array
    {
        $guia->load('emisor');
        $emisor = $guia->emisor;

        // 1. Generar Clave de Acceso si no existe
        if (empty($guia->clave_acceso)) {
            $fechaEmision = Carbon::parse($guia->fecha_emision)->format('dmY');
            $codigoNumerico = str_pad((string) random_int(1, 99999999), 8, '0', STR_PAD_LEFT);

            $guia->clave_acceso = $this->sriService->generarClaveAcceso(
                $fechaEmision,
                '06',
                $emisor->ruc,
                $emisor->ambiente,
                str_pad($guia->establecimiento, 3, '0', STR_PAD_LEFT),
                str_pad($guia->punto_emision, 3, '0', STR_PAD_LEFT),
                str_pad($guia->secuencial, 9, '0', STR_PAD_LEFT),
                $codigoNumerico
            );
            $guia->save();
        }

        // 2. Generar XML y guardar archivo en disco
        $xmlContent = $this->xmlBuilder->generarXml($guia);
        $xmlGeneradoPath = "comprobantes/guias/generados/{$guia->clave_acceso}.xml";
        Storage::put($xmlGeneradoPath, $xmlContent);

        $guia->update([
            'xml_generado_path' => $xmlGeneradoPath,
        ]);

        // 3. Firmar XML mediante Firma Digital Java y guardar archivo firmado en disco
        $p12Path = Storage::path($emisor->p12_path);
        $p12Password = decrypt($emisor->p12_password);
        $xmlFirmado = $this->signatureService->firmarXml($xmlContent, $p12Path, $p12Password);

        $xmlFirmadoPath = "comprobantes/guias/firmados/{$guia->clave_acceso}.xml";
        Storage::put($xmlFirmadoPath, $xmlFirmado);

        $guia->update([
            'xml_firmado_path' => $xmlFirmadoPath,
        ]);

        // 4. Recepción SOAP SRI
        $resRecepcion = $this->sriService->enviarComprobante($xmlFirmado, $emisor->ambiente);

        if ($resRecepcion['estado'] !== 'RECIBIDA') {
            $guia->update([
                'estado_sri' => 'DEVUELTA',
                'mensajes_sri' => json_encode($resRecepcion['errores']),
            ]);

            return ['exito' => false, 'estado' => 'DEVUELTA', 'errores' => $resRecepcion['errores']];
        }

        // 5. Autorización SOAP SRI
        $resAutorizacion = $this->sriService->autorizarComprobante($guia->clave_acceso, $emisor->ambiente);

        if ($resAutorizacion['estado'] === 'AUTORIZADO') {
            $guia->update([
                'estado_sri' => 'AUTORIZADO',
                'fecha_autorizacion' => $resAutorizacion['fechaAutorizacion'],
                'mensajes_sri' => 'Guía de remisión autorizada con éxito.',
            ]);

            return ['exito' => true, 'estado' => 'AUTORIZADO', 'autorizacion' => $resAutorizacion];
        }

        $guia->update([
            'estado_sri' => $resAutorizacion['estado'],
            'mensajes_sri' => json_encode($resAutorizacion['errores']),
        ]);

        return ['exito' => false, 'estado' => $resAutorizacion['estado'], 'errores' => $resAutorizacion['errores']];
    }
}