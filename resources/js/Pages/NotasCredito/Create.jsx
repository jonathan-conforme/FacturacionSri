import React, { useMemo, useState } from 'react';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;

// Fecha local (YYYY-MM-DD). Evita el desfase de UTC en la noche.
const hoyLocal = () => new Date().toLocaleDateString('en-CA');

export default function Create({ auth, factura }) {
    const { data, setData, post, processing, errors, transform } = useForm({
        comprobante_id: factura.id,
        fecha_emision: hoyLocal(),
        motivo: '',
    });

    // Estado por línea: seleccionada o no, y cantidad a acreditar
    const [lineas, setLineas] = useState(() =>
        Object.fromEntries(
            factura.detalles.map((d) => [d.id, { activa: true, cantidad: String(parseFloat(d.cantidad)) }])
        )
    );
    const [errorLocal, setErrorLocal] = useState('');

    const cambiarLinea = (id, cambios) =>
        setLineas((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }));

    // Estimación de totales (el cálculo oficial lo hace el servidor)
    const totales = useMemo(() => {
        let base = 0;
        let iva = 0;

        factura.detalles.forEach((d) => {
            const l = lineas[d.id];
            const cantidad = parseFloat(l?.cantidad);
            if (!l?.activa || !(cantidad > 0)) return;

            const ratio = cantidad / parseFloat(d.cantidad);
            const descuento = parseFloat(d.descuento) * ratio;
            const subtotal = parseFloat(d.precio_unitario) * cantidad - descuento;

            base += subtotal;
            iva += subtotal * (parseFloat(d.tarifa) / 100);
        });

        return { base, iva, total: base + iva };
    }, [lineas, factura.detalles]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorLocal('');

        const items = factura.detalles
            .filter((d) => lineas[d.id].activa)
            .map((d) => ({ detalle_id: d.id, cantidad: parseFloat(lineas[d.id].cantidad) }));

        if (items.length === 0) {
            setErrorLocal('Selecciona al menos una línea para acreditar.');
            return;
        }

        const excede = factura.detalles.find(
            (d) => lineas[d.id].activa && parseFloat(lineas[d.id].cantidad) > parseFloat(d.cantidad)
        );
        if (excede) {
            setErrorLocal(`La cantidad de «${excede.descripcion}» supera la facturada.`);
            return;
        }

        transform((formData) => ({ ...formData, items }));
        post(route('notas-credito.store'));
    };

    const numeroFactura = `${factura.establecimiento}-${factura.punto_emision}-${factura.secuencial}`;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Nueva Nota de Crédito</h2>}
        >
            <Head title="Nueva Nota de Crédito" />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-4">
                    {/* Factura que se modifica */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Factura a modificar
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Número</p>
                                <p className="font-medium text-gray-900">{numeroFactura}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-gray-500">Cliente</p>
                                <p className="font-medium text-gray-900">{factura.cliente?.razon_social}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Total factura</p>
                                <p className="font-medium text-gray-900">{dinero(factura.importe_total)}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha de emisión</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.fecha_emision}
                                    onChange={(e) => setData('fecha_emision', e.target.value)}
                                    required
                                />
                                {errors.fecha_emision && (
                                    <span className="text-sm text-red-600">{errors.fecha_emision}</span>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Motivo</label>
                                <input
                                    type="text"
                                    maxLength={300}
                                    placeholder="Ej: Devolución de mercadería, descuento, error en datos"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.motivo}
                                    onChange={(e) => setData('motivo', e.target.value)}
                                    required
                                />
                                {errors.motivo && <span className="text-sm text-red-600">{errors.motivo}</span>}
                            </div>
                        </div>

                        {/* Líneas */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Líneas a acreditar
                            </h3>
                            <div className="overflow-x-auto border border-gray-200 rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 w-10"></th>
                                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Descripción</th>
                                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Facturado</th>
                                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">P. unitario</th>
                                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">IVA</th>
                                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Acreditar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {factura.detalles.map((d) => (
                                            <tr key={d.id} className={lineas[d.id].activa ? '' : 'bg-gray-50 text-gray-400'}>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300"
                                                        checked={lineas[d.id].activa}
                                                        onChange={(e) => cambiarLinea(d.id, { activa: e.target.checked })}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    <p className="font-medium">{d.descripcion}</p>
                                                    <p className="text-xs text-gray-500">{d.codigo_principal}</p>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-right">{parseFloat(d.cantidad)}</td>
                                                <td className="px-4 py-2 text-sm text-right">{dinero(d.precio_unitario)}</td>
                                                <td className="px-4 py-2 text-sm text-right">{parseFloat(d.tarifa)}%</td>
                                                <td className="px-4 py-2 text-right">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min="0"
                                                        max={parseFloat(d.cantidad)}
                                                        disabled={!lineas[d.id].activa}
                                                        className="w-24 rounded-md border-gray-300 shadow-sm text-right text-sm"
                                                        value={lineas[d.id].cantidad}
                                                        onChange={(e) => cambiarLinea(d.id, { cantidad: e.target.value })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {(errors.items || errorLocal) && (
                                <p className="mt-2 text-sm text-red-600">{errors.items || errorLocal}</p>
                            )}
                            {errors.comprobante_id && (
                                <p className="mt-2 text-sm text-red-600">{errors.comprobante_id}</p>
                            )}
                        </div>

                        {/* Totales estimados */}
                        <div className="flex justify-end">
                            <dl className="w-full md:w-64 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Subtotal</dt>
                                    <dd className="font-medium">{dinero(totales.base)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">IVA</dt>
                                    <dd className="font-medium">{dinero(totales.iva)}</dd>
                                </div>
                                <div className="flex justify-between border-t pt-1 text-base">
                                    <dt className="font-semibold text-gray-700">Total (estimado)</dt>
                                    <dd className="font-semibold">{dinero(totales.total)}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-6 py-2 bg-white text-gray-700 font-semibold rounded-md border border-gray-300 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {processing ? 'Enviando al SRI…' : 'Emitir Nota de Crédito'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}
