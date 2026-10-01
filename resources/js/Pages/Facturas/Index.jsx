import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Index({ comprobantes, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [estado, setEstado] = useState(filters.estado || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('facturas.index'), { search, estado }, { preserveState: true });
    };

    const getEstadoBadge = (estadoSri) => {
        const styles = {
            AUTORIZADO: 'bg-green-100 text-green-800 border-green-300',
            DEVUELTA: 'bg-red-100 text-red-800 border-red-300',
            RECIBIDA: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            CREADO: 'bg-gray-100 text-gray-800 border-gray-300',
        };
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${styles[estadoSri] || styles.CREADO}`}>
                {estadoSri}
            </span>
        );
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Comprobantes Electrónicos</h2>}>
            <Head title="Comprobantes" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg">

                        {/* FILTROS DE BÚSQUEDA */}
                        <form onSubmit={handleFilter} className="mb-6 flex flex-wrap gap-4">
                            <input
                                type="text"
                                placeholder="Buscar por cliente, RUC o clave..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm w-72"
                            />
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            >
                                <option value="">Todos los estados</option>
                                <option value="CREADO">CREADO</option>
                                <option value="RECIBIDA">RECIBIDA</option>
                                <option value="AUTORIZADO">AUTORIZADO</option>
                                <option value="DEVUELTA">DEVUELTA</option>
                            </select>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
                                Filtrar
                            </button>
                        </form>

                        {/* TABLA DE COMPROBANTES */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Secuencial</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Estado SRI</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Mensajes / Errores</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {comprobantes.data.map((c) => (
                                        <tr key={c.id}>
                                            <td className="px-4 py-3 font-medium">{c.establecimiento}-{c.punto_emision}-{c.secuencial}</td>
                                            <td className="px-4 py-3">{c.cliente?.razon_social || 'N/A'}</td>
                                            <td className="px-4 py-3">{c.fecha_emision}</td>
                                            <td className="px-4 py-3 font-bold">${c.importe_total}</td>
                                            <td className="px-4 py-3">{getEstadoBadge(c.estado_sri)}</td>
                                            <td className="px-4 py-3 text-xs text-red-600 max-w-xs truncate" title={c.mensajes_sri}>
                                                {c.mensajes_sri ? JSON.parse(c.mensajes_sri).join(', ') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
