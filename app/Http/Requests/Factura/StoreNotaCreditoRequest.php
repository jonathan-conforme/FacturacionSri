<?php

namespace App\Http\Requests\Factura;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotaCreditoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Factura que se quiere modificar
            'comprobante_id' => 'required|exists:comprobantes,id',
            'fecha_emision' => 'required|date',
            'motivo' => 'required|string|max:300',

            // Opcional: si no se envía, se acredita la factura completa.
            // Si se envía, solo las líneas indicadas y con la cantidad indicada.
            'items' => 'nullable|array|min:1',
            'items.*.detalle_id' => 'required_with:items|integer|exists:detalle_comprobantes,id',
            'items.*.cantidad' => 'required_with:items|numeric|gt:0',
        ];
    }

    public function messages(): array
    {
        return [
            'comprobante_id.required' => 'Debes indicar la factura que se va a modificar.',
            'motivo.required' => 'El motivo es obligatorio (por ejemplo: devolución, descuento, error en datos).',
            'motivo.max' => 'El motivo no puede superar los 300 caracteres.',
        ];
    }
}
