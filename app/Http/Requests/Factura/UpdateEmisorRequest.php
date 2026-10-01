<?php

namespace App\Http\Requests\Factura;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Rules\ValidP12Certificate;

class UpdateEmisorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $emisorId = $this->route('emisor')?->id ?? $this->emisor;

        return [
            'ruc' => ['required', 'string', 'size:13', Rule::unique('emisors', 'ruc')->ignore($emisorId)],
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_comercial' => ['nullable', 'string', 'max:255'],
            'dir_matriz' => ['required', 'string', 'max:255'],
            'dir_establecimiento' => ['nullable', 'string', 'max:255'],
            'codigo_establecimiento' => ['required', 'string', 'size:3'],
            'punto_emision' => ['required', 'string', 'size:3'],
            'ambiente' => ['required', 'in:1,2'],
            'contribuyente_especial' => ['nullable', 'string', 'max:13'],
            'obligado_contabilidad' => ['required', 'in:SI,NO'],

            // Solo valida el archivo p12 si el usuario subió uno nuevo
            'p12_file' => [
                'nullable',
                'file',
                'max:5120',
                Rule::requiredIf(fn () => $this->filled('p12_password') && !$this->hasFile('p12_file')),
                $this->hasFile('p12_file') ? new ValidP12Certificate($this->p12_password) : 'nullable'
            ],
            'p12_password' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Preparar datos antes de validar (convierte strings vacíos en NULL)
     */
    protected function prepareForValidation(): void
    {
        if (trim((string) $this->contribuyente_especial) === '') {
            $this->merge([
                'contribuyente_especial' => null,
            ]);
        }
    }
}
