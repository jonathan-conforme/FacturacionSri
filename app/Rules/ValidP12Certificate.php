<?php
namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidP12Certificate implements ValidationRule
{
    public function __construct(protected ?string $password) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!$value || !$value->isValid()) {
            $fail('El archivo subido no es un archivo válido.');
            return;
        }

        // Inspección del contenido binario con OpenSSL
        $p12Buffer = file_get_contents($value->getRealPath());
        $certs = [];

        // Si se proporciona la contraseña, se intenta leer el certificado real
        if ($this->password) {
            if (!openssl_pkcs12_read($p12Buffer, $certs, $this->password)) {
                $fail('El certificado no es un archivo .p12/.pfx válido o la contraseña ingresada es incorrecta.');
            }
        } else {
            // Validar simplemente que la estructura del archivo sea PKCS#12
            if (!openssl_pkcs12_read($p12Buffer, $certs, '')) {
                // Si falla por contraseña incorrecta es normal, pero valida que sí sea PKCS#12
                $errorCode = openssl_error_string();
                if (str_contains($errorCode, 'mac verify failure') === false && str_contains($errorCode, 'PKCS12') === false) {
                     // Si el error no es de contraseña, el archivo no es PKCS12
                     $fail('El archivo no posee un formato de firma electrónica (.p12/.pfx) válido.');
                }
            }
        }
    }
}
