<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
class Emisor extends Model
{
    use HasFactory;

    protected $fillable = [
        'ruc',
        'razon_social',
        'nombre_comercial',
        'dir_matriz',
        'dir_establecimiento',
        'codigo_establecimiento',
        'punto_emision',
        'ambiente',
        'contribuyente_especial',
        'obligado_contabilidad',
        'p12_path',
        'p12_password',
    ];
  public function getClaveP12Attribute(): string
    {
        // Obtener la cadena cruda almacenada en BD usando getRawOriginal
        $raw = $this->getRawOriginal('p12_password') 
            ?? $this->getRawOriginal('firma_p12_password') 
            ?? $this->getRawOriginal('firma_password');

        if (empty($raw)) {
            return '';
        }

        $val = $raw;

        // 1. Intentar desencriptar solo si la cadena es un payload encriptado válido
        try {
            $val = Crypt::decrypt($raw);
        } catch (\Throwable $e) {
            try {
                $val = Crypt::decryptString($raw);
            } catch (\Throwable $e2) {
                // Si falla (por estar en texto plano), mantenemos el valor crudo
                $val = $raw;
            }
        }

        // 2. Des-serializar de PHP si viene empaquetada
        while (is_string($val) && ($unserialized = @unserialize($val)) !== false) {
            $val = $unserialized;
        }

        // 3. Limpieza por Regex si queda algún residuo tipo s:9:"gaby1991D";
        if (is_string($val) && preg_match('/^s:\d+:"(.*)";$/s', $val, $matches)) {
            $val = $matches[1];
        }

        return (string) $val;
    }

    public function comprobantes()
    {
        return $this->hasMany(Comprobante::class);
    }
}
