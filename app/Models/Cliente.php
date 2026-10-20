<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    protected $fillable = [
        'tipo_identificacion_codigo',
        'identificacion',
        'razon_social',
        'direccion',
        'email',
        'telefono',
    ];

    public function tipoIdentificacion()
    {
        return $this->belongsTo(TipoIdentificacion::class, 'tipo_identificacion_codigo', 'codigo');
    }

    public function comprobantes()
    {
        return $this->hasMany(Comprobante::class);
    }
}
