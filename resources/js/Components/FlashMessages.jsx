import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function FlashMessages() {
    const { flash, errors } = usePage().props;

    useEffect(() => {
        // 1. Mensaje de Éxito
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: flash.success,
                timer: 3000,
                showConfirmButton: false,
            });
        }

        // 2. Mensaje de Error
        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: flash.error,
            });
        }

        // 3. Errores de Validación (cuando pones algo mal)
        if (errors && Object.keys(errors).length > 0) {
            const primerMensaje = Object.values(errors)[0];
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                text: primerMensaje,
            });
        }
    }, [flash, errors]);

    return null; // Este componente no dibuja nada en HTML, solo ejecuta el efecto
}
