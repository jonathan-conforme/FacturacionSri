<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\ImpuestoTarifa;
use App\Models\TipoComprobante;
use App\Models\TipoIdentificacion;

class CatalogosService
{
    public function obtenerDatosParaFactura(): array
    {
        return [
            'clientes' => Cliente::select('id', 'identificacion', 'razon_social', 'email')->get(),
            'impuestos' => ImpuestoTarifa::where('activo', true)->get(['codigo_porcentaje', 'descripcion', 'porcentaje']),
            'tiposComprobante' => TipoComprobante::where('activo', true)->get(['codigo', 'descripcion']),
        ];
    }

    public function obtenerTiposIdentificacion()
    {
        return TipoIdentificacion::where('activo', true)->get();
    }
}
