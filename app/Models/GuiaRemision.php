<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GuiaRemision extends Model
{
    use HasFactory;

    protected $fillable = [
        'emisor_id',
        'cliente_id',
        'comprobante_id',
        'establecimiento',
        'punto_emision',
        'secuencial',
        'clave_acceso',
        'fecha_emision',
        'dir_partida',
        'tipo_identificacion_transportista',
        'identificacion_transportista',
        'razon_social_transportista',
        'placa',
        'fecha_inicio_transporte',
        'fecha_fin_transporte',
        'dir_destinatario',
        'motivo_traslado',
        'ruta',
        'cod_doc_sustento',
        'num_doc_sustento',
        'num_aut_doc_sustento',
        'fecha_emision_doc_sustento',
        'estado_sri',
        'fecha_autorizacion',
        'mensajes_sri',
        'xml_generado_path',
        'xml_firmado_path',
        'pdf_ride_path',
    ];

    public function emisor(): BelongsTo
    {
        return $this->belongsTo(Emisor::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function comprobante(): BelongsTo
    {
        return $this->belongsTo(Comprobante::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(GuiaRemisionDetalle::class);
    }
}