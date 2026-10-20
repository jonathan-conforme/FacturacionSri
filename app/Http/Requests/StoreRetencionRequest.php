<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRetencionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'emisor_id' => ['required', 'exists:emisors,id'],
            'cliente_id' => ['required', 'exists:clientes,id'],
            'fecha_emision' => ['required', 'date'],
            'periodo_fiscal' => ['required', 'string', 'regex:/^(0[1-9]|1[0-2])\/\d{4}$/'], // MM/YYYY
            'establecimiento' => ['nullable', 'string', 'size:3'],
            'punto_emision' => ['nullable', 'string', 'size:3'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.cod_sustento' => ['nullable', 'string'],
            'detalles.*.cod_doc_sustento' => ['required', 'string'],
            'detalles.*.num_doc_sustento' => ['required', 'string'],
            'detalles.*.fecha_emision_doc_sustento' => ['required', 'date'],
            'detalles.*.codigo_impuesto' => ['required', 'string', 'in:1,2,6'],
            'detalles.*.codigo_retencion' => ['required', 'string'],
            'detalles.*.base_imponible' => ['required', 'numeric', 'gt:0'],
            'detalles.*.porcentaje_retener' => ['required', 'numeric', 'gte:0'],
        ];
    }
}
