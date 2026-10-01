<?php

namespace App\Services\Sri;

use Exception;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class SignatureService
{
    /**
     * Firma un documento XML en formato XAdES-BES ejecutando el archivo Java directo.
     */
    public function firmarXml(string $xmlContent, string $p12Path, string $p12Password): string
    {
        if (! file_exists($p12Path)) {
            throw new Exception("El archivo de firma digital (.p12) no existe en la ruta: {$p12Path}");
        }

        // 1. Archivos temporales de entrada y salida
        $tempInputPath = tempnam(sys_get_temp_dir(), 'xml_in_');
        $tempOutputPath = tempnam(sys_get_temp_dir(), 'xml_out_');

        file_put_contents($tempInputPath, $xmlContent);

        try {
            // 2. Ruta a tu fuente Java
            $javaFilePath = storage_path('app/binaries/FirmadorSri.java');
            $libsPath = storage_path('app/binaries/libs/*');

            if (! file_exists($javaFilePath)) {
                throw new Exception("El archivo FirmadorSri.java no existe en la ruta: {$javaFilePath}");
            }

            // 3. Ejecución directa con Java (Single-File Source-Code Execution)
            $process = new Process([
                'java',
                '-cp',
                ".;{$libsPath}",
                $javaFilePath,
                $tempInputPath,
                $p12Path,
                $p12Password,
                $tempOutputPath,
            ]);

            $process->setTimeout(60);
            $process->run();

            if (! $process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }

            // 4. Obtener resultado firmado
            if (! file_exists($tempOutputPath) || filesize($tempOutputPath) === 0) {
                throw new Exception('Java no generó el archivo firmado.');
            }

            return file_get_contents($tempOutputPath);

        } finally {
            // 5. Limpieza de temporales
            if (file_exists($tempInputPath)) {
                @unlink($tempInputPath);
            }
            if (file_exists($tempOutputPath)) {
                @unlink($tempOutputPath);
            }
        }
    }
}
