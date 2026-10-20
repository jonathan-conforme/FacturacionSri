<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetencionDetalle extends Model
{
    use HasFactory;

    protected $table = 'retencion_detalles';

    protected $fillable = [
        'comprobante_id',
        'cod_sustento',
        'cod_doc_sustento',
        'num_doc_sustento',
        'fecha_emision_doc_sustento',
        'codigo_impuesto',
        'codigo_retencion',
        'base_imponible',
        'porcentaje_retener',
        'valor_retenido',
    ];

    public function comprobante(): BelongsTo
    {
        return $this->belongsTo(Comprobante::class);
    }
}
