<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\TipoIdentificacion;

class ClienteService
{
    public function crearCliente(array $data): Cliente
    {
        $tipoIdentificacion = TipoIdentificacion::where('codigo', $data['tipo_identificacion_codigo'])->firstOrFail();

        return Cliente::create([
            'tipo_identificacion_codigo' => $tipoIdentificacion->codigo,
            'identificacion' => $data['identificacion'],
            'razon_social' => $data['razon_social'],
            'direccion' => $data['direccion'] ?? null,
            'email' => $data['email'] ?? null,
            'telefono' => $data['telefono'] ?? null,
        ]);
    }
}
