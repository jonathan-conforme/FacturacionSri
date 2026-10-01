import { useForm } from '@inertiajs/react';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index({ emisor }) {
    // Definimos el formulario con los datos iniciales si ya existe un Emisor
    const { data, setData, post, put, processing, errors } = useForm({
        _method: emisor ? 'PUT' : 'POST', // Permite el envío de archivos con método PUT en Laravel
        ruc: emisor?.ruc || '',
        razon_social: emisor?.razon_social || '',
        nombre_comercial: emisor?.nombre_comercial || '',
        dir_matriz: emisor?.dir_matriz || '',
        dir_establecimiento: emisor?.dir_establecimiento || '',
        codigo_establecimiento: emisor?.codigo_establecimiento || '001',
        punto_emision: emisor?.punto_emision || '001',
        ambiente: emisor?.ambiente || '1', // 1: Pruebas, 2: Producción
        contribuyente_especial: emisor?.contribuyente_especial || '',
        obligado_contabilidad: emisor?.obligado_contabilidad || 'NO',
        p12_file: null,
        p12_password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (emisor) {
            // Nota: Para subir archivos en actualizaciones (PUT), usaremos POST apuntando a la ruta update con _method: 'PUT'
            post(route('emisor.update', emisor.id), {
                forceFormData: true,
            });
        } else {
            post(route('emisor.store'), {
                forceFormData: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Configuración del Emisor (SRI)</h2>}
        >
            <Head title="Configuración de Emisor" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* SECCIÓN 1: DATOS DE LA EMPRESA */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                                    Información General
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">RUC *</label>
                                        <input
                                            type="text"
                                            value={data.ruc}
                                            maxLength={13}
                                            onChange={(e) => setData('ruc', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.ruc && <p className="text-sm text-red-600 mt-1">{errors.ruc}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Razón Social *</label>
                                        <input
                                            type="text"
                                            value={data.razon_social}
                                            onChange={(e) => setData('razon_social', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.razon_social && <p className="text-sm text-red-600 mt-1">{errors.razon_social}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nombre Comercial</label>
                                        <input
                                            type="text"
                                            value={data.nombre_comercial}
                                            onChange={(e) => setData('nombre_comercial', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.nombre_comercial && <p className="text-sm text-red-600 mt-1">{errors.nombre_comercial}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Obligado a Llevar Contabilidad *</label>
                                        <select
                                            value={data.obligado_contabilidad}
                                            onChange={(e) => setData('obligado_contabilidad', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="NO">NO</option>
                                            <option value="SI">SI</option>
                                        </select>
                                        {errors.obligado_contabilidad && <p className="text-sm text-red-600 mt-1">{errors.obligado_contabilidad}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Dirección Matriz *</label>
                                        <input
                                            type="text"
                                            value={data.dir_matriz}
                                            onChange={(e) => setData('dir_matriz', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.dir_matriz && <p className="text-sm text-red-600 mt-1">{errors.dir_matriz}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Dirección Establecimiento</label>
                                        <input
                                            type="text"
                                            value={data.dir_establecimiento}
                                            onChange={(e) => setData('dir_establecimiento', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.dir_establecimiento && <p className="text-sm text-red-600 mt-1">{errors.dir_establecimiento}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: PARÁMETROS DEL SRI */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                                    Parámetros de Facturación Electrónica
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Cód. Establecimiento *</label>
                                        <input
                                            type="text"
                                            maxLength={3}
                                            value={data.codigo_establecimiento}
                                            onChange={(e) => setData('codigo_establecimiento', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.codigo_establecimiento && <p className="text-sm text-red-600 mt-1">{errors.codigo_establecimiento}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Punto de Emisión *</label>
                                        <input
                                            type="text"
                                            maxLength={3}
                                            value={data.punto_emision}
                                            onChange={(e) => setData('punto_emision', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.punto_emision && <p className="text-sm text-red-600 mt-1">{errors.punto_emision}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ambiente SRI *</label>
                                        <select
                                            value={data.ambiente}
                                            onChange={(e) => setData('ambiente', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="1">1 - Pruebas</option>
                                            <option value="2">2 - Producción</option>
                                        </select>
                                        {errors.ambiente && <p className="text-sm text-red-600 mt-1">{errors.ambiente}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nro. Contribuyente Especial</label>
                                        <input
                                            type="text"
                                            value={data.contribuyente_especial}
                                            onChange={(e) => setData('contribuyente_especial', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="Opcional"
                                        />
                                        {errors.contribuyente_especial && <p className="text-sm text-red-600 mt-1">{errors.contribuyente_especial}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 3: FIRMA ELECTRÓNICA */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                                    Firma Electrónica (.p12 / .pfx)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Archivo de la Firma</label>
                                        <input
                                            type="file"
                                            accept=".p12,.pfx"
                                            onChange={(e) => setData('p12_file', e.target.files[0])}
                                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        />
                                        {emisor?.p12_path && (
                                            <p className="text-xs text-green-600 mt-1">✓ Certificado cargado actualmente en el servidor.</p>
                                        )}
                                        {errors.p12_file && <p className="text-sm text-red-600 mt-1">{errors.p12_file}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contraseña de la Firma</label>
                                        <input
                                            type="password"
                                            value={data.p12_password}
                                            onChange={(e) => setData('p12_password', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder={emisor?.p12_password ? '•••••••• (Dejar en blanco para conservar)' : 'Contraseña de la firma'}
                                        />
                                        {errors.p12_password && <p className="text-sm text-red-600 mt-1">{errors.p12_password}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* BOTÓN GUARDAR */}
                            <div className="flex justify-end pt-4 border-t">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Configuración'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}
