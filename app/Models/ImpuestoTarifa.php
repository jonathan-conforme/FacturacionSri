<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImpuestoTarifa extends Model
{
    use HasFactory;

    protected $table = 'impuesto_tarifas';

    protected $fillable = [
        'codigo_impuesto',
        'codigo_porcentaje',
        'descripcion',
        'porcentaje',
        'activo',
    ];
}
