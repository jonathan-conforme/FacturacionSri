<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoIdentificacion extends Model
{
    use HasFactory;

    protected $fillable = ['codigo', 'descripcion', 'activo'];

    public function clientes()
    {
        return $this->hasMany(Cliente::class, 'tipo_identificacion_codigo', 'codigo');
    }
}
