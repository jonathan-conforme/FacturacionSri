<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comprobante extends Model
{
    use HasFactory;

    protected $fillable = [
        'emisor_id',
        'cliente_id',
        'comprobante_modificado_id',
        'tipo_comprobante',
        'establecimiento',
        'punto_emision',
        'secuencial',
        'clave_acceso',
        'fecha_emision',
        'total_sin_impuestos',
        'subtotal_15',
        'subtotal_0',
        'monto_iva',
        'motivo',
        'propina',
        'importe_total',
        'estado_sri',
        'fecha_autorizacion',
        'mensajes_sri',
        'xml_generado_path',
        'xml_firmado_path',
        'pdf_ride_path',
    ];

    public function emisor()
    {
        return $this->belongsTo(Emisor::class);
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function detalles()
    {
        return $this->hasMany(DetalleComprobante::class);
    }

       public function comprobanteModificado(): BelongsTo
    {
        // Reemplaza 'comprobante_id' si tu clave foránea en la base de datos se llama diferente
        return $this->belongsTo(Comprobante::class, 'comprobante_modificado_id');
    }
}
