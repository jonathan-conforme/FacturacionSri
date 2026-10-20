<?php

namespace App\Http\Controllers;

use App\Models\Comprobante;
use App\Services\ReenvioComprobanteService;

class ReintentoComprobanteController extends Controller
{
    public function __invoke(Comprobante $comprobante, ReenvioComprobanteService $servicio)
    {
        $resultado = $servicio->reintentar($comprobante);

        if ($resultado->estado_sri === 'AUTORIZADO') {
            return redirect()->back()->with('success', 'Comprobante autorizado por el SRI.');
        }

        return redirect()->back()->with(
            'error',
            "El comprobante sigue en estado {$resultado->estado_sri}. Revisa la columna Mensajes."
        );
    }
}
 