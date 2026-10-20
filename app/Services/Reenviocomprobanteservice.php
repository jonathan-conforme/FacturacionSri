<?php

namespace App\Services;

use App\Models\Comprobante;
use App\Services\Sri\SignatureService;
use App\Services\Sri\SriService;
use App\Services\Xml\XmlFacturaBuilder;
use App\Services\Xml\XmlNotaCreditoBuilder;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Reintenta un comprobante que no llegó a autorizarse, SIEMPRE con la misma
 * clave de acceso y el mismo secuencial (como exige la ficha técnica del SRI).
 */
class ReenvioComprobanteService
{
    private const REINTENTABLES = ['DEVUELTA', 'NO AUTORIZADO', 'ERROR', 'ERROR_SOAP', 'EN PROCESO'];

    public function __construct(
        protected SriService $sri,
        protected XmlFacturaBuilder $facturaBuilder,
        protected XmlNotaCreditoBuilder $notaCreditoBuilder,
        protected SignatureService $signature
    ) {}

    public function reintentar(Comprobante $c): Comprobante
    {
        if (! in_array($c->estado_sri, self::REINTENTABLES, true)) {
            throw ValidationException::withMessages([
                'estado' => "Un comprobante en estado {$c->estado_sri} no se puede reintentar.",
            ]);
        }

        $emisor = $c->emisor;
        $password = null;

        try {
            // 1. ¿El SRI ya lo tiene autorizado? (típico tras un timeout)
            $aut = $this->consultarAutorizacion($c->clave_acceso, $emisor->ambiente, 1);

            if ($aut['estado'] === 'AUTORIZADO') {
                return $this->guardarAutorizacion($c, $aut);
            }

            // Error 70 anterior: la ficha prohíbe reenviar mientras está en procesamiento
            if ($c->estado_sri === 'EN PROCESO') {
                return $this->marcar($c, 'EN PROCESO', $aut['errores'] ?: ['Aún sin respuesta del SRI.']);
            }

            // 2. Regenerar el XML con los datos guardados (misma clave y secuencial) y firmar
            $xml = match ($c->tipo_comprobante) {
                '01' => $this->facturaBuilder->generarXml($c),
                '04' => $this->notaCreditoBuilder->generarXml($c),
                default => throw new Exception("Tipo de comprobante {$c->tipo_comprobante} no soportado."),
            };

            $p12Path = Storage::path($emisor->p12_path);

            if (! file_exists($p12Path)) {
                throw new Exception('El certificado .p12 no existe en la ruta configurada.');
            }

            $password = decrypt($emisor->p12_password);
            $xmlFirmado = $this->signature->firmarXml($xml, $p12Path, $password);

            $xmlPath = "sri/xml_generados/{$c->clave_acceso}.xml";
            $xmlFirmadoPath = "sri/xml_firmados/{$c->clave_acceso}_firmado.xml";
            Storage::put($xmlPath, $xml);
            Storage::put($xmlFirmadoPath, $xmlFirmado);

            $c->update(['xml_generado_path' => $xmlPath, 'xml_firmado_path' => $xmlFirmadoPath]);

            // 3. Recepción
            $rec = $this->sri->enviarComprobante($xmlFirmado, $emisor->ambiente);

            if ($rec['estado'] !== 'RECIBIDA') {
                $texto = implode(' ', $rec['errores']);

                if (str_contains($texto, '[70]')) {
                    return $this->marcar($c, 'EN PROCESO', $rec['errores']);
                }

                // 43 = clave ya registrada: el SRI ya lo tiene, se sigue con la autorización
                if (! str_contains($texto, '[43]')) {
                    return $this->marcar($c, 'DEVUELTA', $rec['errores']);
                }
            }

            // 4. Autorización
            $aut = $this->consultarAutorizacion($c->clave_acceso, $emisor->ambiente, 3);

            return $aut['estado'] === 'AUTORIZADO'
                ? $this->guardarAutorizacion($c, $aut)
                : $this->marcar($c, $aut['estado'], $aut['errores'] ?? []);
        } catch (Throwable $e) {
            // El mensaje de ProcessFailedException incluye el comando con la contraseña del .p12
            $mensaje = $password ? str_replace($password, '********', $e->getMessage()) : $e->getMessage();

            return $this->marcar($c, 'ERROR', [$mensaje]);
        }
    }

    private function consultarAutorizacion(string $clave, string $ambiente, int $intentos): array
    {
        $resultado = ['estado' => 'NO AUTORIZADO', 'errores' => []];

        for ($i = 1; $i <= $intentos; $i++) {
            $resultado = $this->sri->autorizarComprobante($clave, $ambiente);

            if (! str_starts_with($resultado['errores'][0] ?? '', 'Sin respuesta')) {
                break;
            }

            if ($i < $intentos) {
                sleep(2);
            }
        }

        return $resultado;
    }

    private function guardarAutorizacion(Comprobante $c, array $aut): Comprobante
    {
        $c->update([
            'estado_sri' => 'AUTORIZADO',
            'fecha_autorizacion' => isset($aut['fechaAutorizacion'])
                ? Carbon::parse($aut['fechaAutorizacion'])->setTimezone(config('app.timezone'))->toDateTimeString()
                : null,
            'mensajes_sri' => json_encode([], JSON_UNESCAPED_UNICODE),
        ]);

        return $c;
    }

    private function marcar(Comprobante $c, string $estado, array $errores): Comprobante
    {
        $c->update([
            'estado_sri' => $estado,
            'mensajes_sri' => json_encode($errores, JSON_UNESCAPED_UNICODE),
        ]);

        return $c;
    }
}
