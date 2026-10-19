<?php

namespace App\Services\Sri;

use Exception;
use SoapClient;

class SriService
{
    private array $urls = [
        '1' => [ // Pruebas
            'recepcion' => 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
            'autorizacion' => 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
        ],
        '2' => [ // Producción
            'recepcion' => 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
            'autorizacion' => 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
        ],
    ];

    public function generarClaveAcceso(
        string $fechaEmision,     // Formato ddmmaaaa (Ej: 27092026)
        string $tipoComprobante, // Ej: '01' para Factura
        string $ruc,             // RUC de 13 dígitos
        string $ambiente,        // '1': Pruebas, '2': Producción
        string $establecimiento, // Ej: '001'
        string $puntoEmision,    // Ej: '001'
        string $secuencial,      // Ej: '000000001' (9 dígitos)
        string $codigoNumerico,  // Ej: '12345678' (8 dígitos aleatorios)
        string $tipoEmision = '1'// Always '1' (Emisión Normal en Esquema Offline)
    ): string {
        // 1. Concatenar los primeros 48 dígitos
        $clave48 = $fechaEmision
                 .$tipoComprobante
                 .$ruc
                 .$ambiente
                 .$establecimiento
                 .$puntoEmision
                 .$secuencial
                 .$codigoNumerico
                 .$tipoEmision;

        // 2. Calcular el dígito verificador usando Módulo 11
        $digitoVerificador = $this->calcularModulo11($clave48);

        // 3. Retornar la clave de acceso completa de 49 dígitos
        return $clave48.$digitoVerificador;
    }

    /**
     * Algoritmo Módulo 11 con ponderado inverso (2 al 7)
     */
    private function calcularModulo11(string $cadena): int
    {
        $factor = 2;
        $suma = 0;

        // Recorrer la cadena de derecha a izquierda
        for ($i = strlen($cadena) - 1; $i >= 0; $i--) {
            $suma += (int) $cadena[$i] * $factor;
            $factor = ($factor == 7) ? 2 : $factor + 1;
        }

        $residuo = $suma % 11;
        $digito = 11 - $residuo;

        if ($digito == 11) {
            return 0;
        }

        if ($digito == 10) {
            return 1;
        }

        return $digito;
    }

    public function enviarComprobante(string $xml, string $ambiente = '1'): array
    {

        set_time_limit(120);
        ini_set('default_socket_timeout', '90');

        try {
            $client = new SoapClient($this->urls[$ambiente]['recepcion'], [
                'trace' => 1,
                'exceptions' => true,
                'connection_timeout' => 15,
            ]);
            $response = $client->validarComprobante(['xml' => $xml]);

            $estado = $response->RespuestaRecepcionComprobante->estado ?? 'DESCONOCIDO';

            if ($estado === 'RECIBIDA') {
                return ['estado' => 'RECIBIDA', 'errores' => []];
            } else {
                $errores = $this->extraerErrores($response->RespuestaRecepcionComprobante->comprobantes->comprobante ?? null);

                return ['estado' => 'DEVUELTA', 'errores' => $errores];
            }
        } catch (Exception $e) {
            return [
                'estado' => 'DEVUELTA',
                'errores' => ['Error SOAP Recepción: '.$e->getMessage()],
            ];
        }
    }

    public function autorizarComprobante(string $claveAcceso, string $ambiente = '1'): array
    {
        set_time_limit(120);
        ini_set('default_socket_timeout', '90');

        try {
            $client = new SoapClient($this->urls[$ambiente]['autorizacion'], ['trace' => 1, 'exceptions' => true]);
            $response = $client->autorizacionComprobante(['claveAccesoComprobante' => $claveAcceso]);

            $autorizaciones = $response->RespuestaAutorizacionComprobante->autorizaciones->autorizacion ?? null;

            if (! $autorizaciones) {
                return [
                    'estado' => 'NO AUTORIZADO',
                    'errores' => ['Sin respuesta de autorización del SRI.'],
                ];
            }

            if (! is_array($autorizaciones)) {
                $autorizaciones = [$autorizaciones];
            }

            $aut = $autorizaciones[0];
            $estado = $aut->estado ?? 'NO AUTORIZADO';

            if ($estado === 'AUTORIZADO') {
                return [
                    'estado' => 'AUTORIZADO',
                    'numeroAutorizacion' => $aut->numeroAutorizacion,
                    'fechaAutorizacion' => $aut->fechaAutorizacion,
                    'errores' => [],
                ];
            } else {
                return [
                    'estado' => $estado,
                    'errores' => $this->extraerErrores($aut),
                ];
            }
        } catch (Exception $e) {
            return [
                'estado' => 'ERROR_SOAP',
                'errores' => ['Error SOAP Autorización: '.$e->getMessage()],
            ];
        }
    }

    private function extraerErrores($objeto): array
    {
        $errores = [];
        if (isset($objeto->mensajes->mensaje)) {
            $mensajes = $objeto->mensajes->mensaje;
            if (! is_array($mensajes)) {
                $mensajes = [$mensajes];
            }

            foreach ($mensajes as $m) {
                $id = $m->identificador ?? '';
                $msg = $m->mensaje ?? '';
                $info = $m->informacionAdicional ?? '';
                $errores[] = "[$id] $msg - $info";
            }
        } else {
            $errores[] = 'Error desconocido en el SRI.';
        }

          return $errores;
    }
}
