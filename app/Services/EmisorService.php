<?php

namespace App\Services;

use App\Models\Emisor;
use Illuminate\Support\Facades\Storage;

class EmisorService
{
    public function obtenerEmisor(): ?Emisor
    {
        return Emisor::first();
    }

    public function guardarOActualizar(array $data, ?Emisor $emisor = null): Emisor
    {
        $emisor = $emisor ?? Emisor::first() ?? new Emisor();

        // 1. Sanitizar contribuyente_especial (convierte texto vacío o emails a NULL)
        if (array_key_exists('contribuyente_especial', $data)) {
            $val = trim((string) $data['contribuyente_especial']);
            $data['contribuyente_especial'] = (!empty($val) && is_numeric($val)) ? $val : null;
        }

        // 2. Manejo del archivo .p12 en storage/app/private/certificados
        if (isset($data['p12_file']) && $data['p12_file']->isValid()) {
            // Si ya existe un certificado previo en app/private/, eliminarlo
            if ($emisor->p12_path && Storage::exists($emisor->p12_path)) {
                Storage::delete($emisor->p12_path);
            }

            // Guarda automáticamente dentro de storage/app/private/certificados
            $path = $data['p12_file']->store('certificados');
            $data['p12_path'] = $path;
        }

        unset($data['p12_file']);

        // 3. Manejo de la contraseña
        if (!empty($data['p12_password'])) {
            $data['p12_password'] = encrypt($data['p12_password']);
        } else {
            unset($data['p12_password']);
        }

        // 4. Guardar cambios
        $emisor->fill($data);
        $emisor->save();

        return $emisor;
    }
}
