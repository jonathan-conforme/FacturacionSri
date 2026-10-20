<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGuiaRemisionRequest extends FormRequest
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
            'comprobante_id' => ['nullable', 'exists:comprobantes,id'],

            // Numeración del comprobante
            'establecimiento' => ['required', 'string', 'size:3'],
            'punto_emision' => ['required', 'string', 'size:3'],
            'secuencial' => ['required', 'string', 'max:9'],
            'fecha_emision' => ['required', 'date'],

            // Transporte
            'dir_partida' => ['required', 'string', 'max:300'],
            'tipo_identificacion_transportista' => ['required', 'string', 'in:04,05,06,08'],
            'identificacion_transportista' => ['required', 'string', 'max:20'],
            'razon_social_transportista' => ['required', 'string', 'max:300'],
            'placa' => ['required', 'string', 'max:20'],
            'fecha_inicio_transporte' => ['required', 'date'],
            'fecha_fin_transporte' => ['required', 'date', 'after_or_equal:fecha_inicio_transporte'],

            // Destino y Documento Sustento
            'dir_destinatario' => ['required', 'string', 'max:300'],
            'motivo_traslado' => ['required', 'string', 'max:300'],
            'ruta' => ['nullable', 'string', 'max:300'],
            'cod_doc_sustento' => ['nullable', 'string', 'size:2'],
            'num_doc_sustento' => ['nullable', 'string', 'max:17'],
            'num_aut_doc_sustento' => ['nullable', 'string', 'digits:49'],
            'fecha_emision_doc_sustento' => ['nullable', 'date'],

            // Detalles de ítems trasladados
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.codigo_interno' => ['required', 'string', 'max:25'],
            'detalles.*.codigo_adicional' => ['nullable', 'string', 'max:25'],
            'detalles.*.descripcion' => ['required', 'string', 'max:300'],
            'detalles.*.cantidad' => ['required', 'numeric', 'gt:0'],
        ];
    }
}