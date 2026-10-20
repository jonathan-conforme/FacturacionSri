<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuiaRemisionDetalle extends Model
{
    protected $fillable = [
        'guia_remision_id', 
        'codigo_interno', 
        'codigo_adicional', 
        'descripcion', 
        'cantidad'
        ];

    public function guiaRemision(): BelongsTo { 
        return $this->belongsTo(GuiaRemision::class); 
        }
}