<?php

namespace App\Http\Requests;

use App\Models\Comprobante;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreNotaDebitoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepara los datos antes de ejecutar las reglas de validación.
     */
    protected function prepareForValidation(): void
    {
        if ($this->comprobante_id) {
            $factura = Comprobante::find($this->comprobante_id);

            if ($factura) {
                $numDoc = sprintf(
                    '%s-%s-%s',
                    $factura->establecimiento,
                    $factura->punto_emision,
                    str_pad($factura->secuencial, 9, '0', STR_PAD_LEFT)
                );

                $this->merge([
                    'emisor_id' => $this->emisor_id ?? $factura->emisor_id,
                    'cliente_id' => $this->cliente_id ?? $factura->cliente_id,
                    'num_doc_modificado' => $this->num_doc_modificado ?? $numDoc,
                    'fecha_emision_doc_sustento' => $this->fecha_emision_doc_sustento ?? $factura->fecha_emision,
                ]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'comprobante_id' => ['required', 'exists:comprobantes,id'],
            'emisor_id' => ['required', 'exists:emisors,id'],
            'cliente_id' => ['required', 'exists:clientes,id'],
            'num_doc_modificado' => ['required', 'string', 'regex:/^\d{3}-\d{3}-\d{9}$/'],
            'fecha_emision_doc_sustento' => ['required', 'date'],
            'porcentaje_iva' => ['required', 'numeric'],
            'forma_pago' => ['nullable', 'string'],
            'motivos' => ['required', 'array', 'min:1'],
            'motivos.*.razon' => ['required', 'string', 'max:300'],
            'motivos.*.valor' => ['required', 'numeric', 'min:0.01'],
        ];
    }
}
