<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetalleComprobante extends Model
{
    use HasFactory;

    protected $fillable = [
        'comprobante_id',
        'codigo_principal',
        'codigo_auxiliar',
        'descripcion',
        'cantidad',
        'precio_unitario',
        'descuento',
        'precio_total_sin_impuesto',
        'codigo_impuesto',
        'codigo_porcentaje',
        'tarifa',
        'base_imponible',
        'valor_impuesto',
    ];

    public function comprobante()
    {
        return $this->belongsTo(Comprobante::class);
    }
}
