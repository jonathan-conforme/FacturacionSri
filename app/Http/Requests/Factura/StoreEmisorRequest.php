<?php

namespace App\Http\Requests\Factura;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\ValidP12Certificate;

class StoreEmisorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ruc' => ['required', 'string', 'size:13', 'unique:emisors,ruc'],
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_comercial' => ['nullable', 'string', 'max:255'],
            'dir_matriz' => ['required', 'string', 'max:255'],
            'dir_establecimiento' => ['nullable', 'string', 'max:255'],
            'codigo_establecimiento' => ['required', 'string', 'size:3'],
            'punto_emision' => ['required', 'string', 'size:3'],
            'ambiente' => ['required', 'in:1,2'],
            'contribuyente_especial' => ['nullable', 'string', 'max:50'],
            'obligado_contabilidad' => ['required', 'in:SI,NO'],
            'p12_file' => ['nullable', 'file', 'max:5120', new ValidP12Certificate($this->p12_password)],
            'p12_password' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'ruc.required' => 'El RUC es obligatorio.',
            'ruc.size' => 'El RUC debe tener exactamente 13 dígitos.',
            'ruc.unique' => 'Este RUC ya se encuentra registrado.',
            'razon_social.required' => 'La Razón Social es obligatoria.',
            'dir_matriz.required' => 'La Dirección Matriz es obligatoria.',
            'p12_file.mimes' => 'El certificado debe ser un archivo de extensión .p12 o .pfx.',
        ];
    }
}
