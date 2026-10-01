import React from 'react';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ auth, clientes }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Clientes</h2>
                    <Link
                        href={route('clientes.create')}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500"
                    >
                        Nuevo cliente
                    </Link>
                </div>
            }
        >
            <Head title="Clientes" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Tipo</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Identificación</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Razón social</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Dirección</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Teléfono</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {clientes.data.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            Aún no hay clientes. Registra el primero con «Nuevo cliente».
                                        </td>
                                    </tr>
                                )}

                                {clientes.data.map((cliente) => (
                                    <tr key={cliente.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm text-gray-700">
                                            {cliente.tipo_identificacion_rel?.descripcion ?? cliente.tipo_identificacion_codigo}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{cliente.identificacion}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900">{cliente.razon_social}</td>
                                        <td className="px-6 py-3 text-sm text-gray-700">{cliente.direccion || '—'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-700">{cliente.email || '—'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-700">{cliente.telefono || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {clientes.links.length > 3 && (
                        <nav className="mt-4 flex flex-wrap justify-center gap-1">
                            {clientes.links.map((link, i) =>
                                link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        preserveScroll
                                        className={`px-3 py-1 text-sm rounded-md border ${
                                            link.active
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="px-3 py-1 text-sm rounded-md border border-gray-200 text-gray-400"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            )}
                        </nav>
                    )}
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}
