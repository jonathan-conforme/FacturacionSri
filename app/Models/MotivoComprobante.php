<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MotivoComprobante extends Model
{
    use HasFactory;

    protected $fillable = [
        'comprobante_id',
        'razon',
        'valor',
    ];

    public function comprobante()
    {
        return $this->belongsTo(Comprobante::class);
    }
}
