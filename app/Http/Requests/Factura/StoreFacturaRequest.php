<?php

namespace App\Http\Requests\Factura;

use Illuminate\Foundation\Http\FormRequest;

class StoreFacturaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cliente_id' => 'required|exists:clientes,id',
            'fecha_emision' => 'required|date',
            'propina' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.codigo_principal' => 'required|string',
            'items.*.codigo_auxiliar' => 'nullable|string',
            'items.*.descripcion' => 'required|string',
            'items.*.cantidad' => 'required|numeric|gt:0',
            'items.*.precio_unitario' => 'required|numeric|gte:0',
            'items.*.descuento' => 'nullable|numeric|gte:0',
            'items.*.codigo_porcentaje' => 'required|string|exists:impuesto_tarifas,codigo_porcentaje',
        ];
    }
}
