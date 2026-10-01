<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    public function comprobantes()
    {
        return $this->hasMany(Comprobante::class);
    }
}
