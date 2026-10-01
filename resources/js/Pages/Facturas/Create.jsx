import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/FlashMessages';
import { Head, useForm } from '@inertiajs/react';

export default function Create({ auth, clientes, impuestos }) {
    const { data, setData, post, processing, errors } = useForm({
        cliente_id: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        propina: 0,
        items: [
            {
                codigo_principal: 'PROD001',
                codigo_auxiliar: '',
                descripcion: '',
                cantidad: 1,
                precio_unitario: 0,
                descuento: 0,
                codigo_porcentaje: '4', // IVA 15% por defecto
            },
        ],
    });

    const handleAddItem = () => {
        setData('items', [
            ...data.items,
            {
                codigo_principal: '',
                codigo_auxiliar: '',
                descripcion: '',
                cantidad: 1,
                precio_unitario: 0,
                descuento: 0,
                codigo_porcentaje: '4',
            },
        ]);
    };

    const handleRemoveItem = (index) => {
        const updatedItems = data.items.filter((_, i) => i !== index);
        setData('items', updatedItems);
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...data.items];
        updatedItems[index][field] = value;
        setData('items', updatedItems);
    };

    // Cálculos dinámicos en la interfaz
    const calcularSubtotales = () => {
        let subtotal15 = 0;
        let subtotal0 = 0;
        let totalIva = 0;

        data.items.forEach((item) => {
            const cant = parseFloat(item.cantidad) || 0;
            const precio = parseFloat(item.precio_unitario) || 0;
            const desc = parseFloat(item.descuento) || 0;
            const subtotalItem = cant * precio - desc;

            const impuestoSeleccionado = impuestos.find((i) => i.codigo_porcentaje === item.codigo_porcentaje);
            const porcentaje = impuestoSeleccionado ? parseFloat(impuestoSeleccionado.porcentaje) : 0;

            if (porcentaje > 0) {
                subtotal15 += subtotalItem;
                totalIva += subtotalItem * (porcentaje / 100);
            } else {
                subtotal0 += subtotalItem;
            }
        });

        const subtotalGeneral = subtotal15 + subtotal0;
        const propina = parseFloat(data.propina) || 0;
        const totalPagar = subtotalGeneral + totalIva + propina;

        return { subtotal15, subtotal0, subtotalGeneral, totalIva, totalPagar };
    };

    const { subtotal15, subtotal0, subtotalGeneral, totalIva, totalPagar } = calcularSubtotales();

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('facturas.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Emitir Nueva Factura</h2>}
        >
            <Head title="Crear Factura" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {errors.error && (
                        <div className="p-4 bg-red-100 text-red-700 rounded-md">
                            {errors.error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
                        {/* Cabecera de Datos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.cliente_id}
                                    onChange={(e) => setData('cliente_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Seleccione un Cliente --</option>
                                    {clientes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.identificacion} - {c.razon_social}
                                        </option>
                                    ))}
                                </select>
                                {errors.cliente_id && <span className="text-sm text-red-600">{errors.cliente_id}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha de Emisión</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.fecha_emision}
                                    onChange={(e) => setData('fecha_emision', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Detalles de la Factura */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Detalle de Productos</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 text-left">Código</th>
                                            <th className="p-2 text-left">Descripción</th>
                                            <th className="p-2 text-left w-20">Cant.</th>
                                            <th className="p-2 text-left w-28">P. Unitario</th>
                                            <th className="p-2 text-left w-24">Desc.</th>
                                            <th className="p-2 text-left w-36">Impuesto</th>
                                            <th className="p-2 text-left">Subtotal</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {data.items.map((item, index) => {
                                            const cant = parseFloat(item.cantidad) || 0;
                                            const pu = parseFloat(item.precio_unitario) || 0;
                                            const desc = parseFloat(item.descuento) || 0;
                                            const subtotalRow = (cant * pu - desc).toFixed(2);

                                            return (
                                                <tr key={index}>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            className="w-full rounded border-gray-300 p-1 text-sm"
                                                            value={item.codigo_principal}
                                                            onChange={(e) => handleItemChange(index, 'codigo_principal', e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            className="w-full rounded border-gray-300 p-1 text-sm"
                                                            value={item.descripcion}
                                                            onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full rounded border-gray-300 p-1 text-sm"
                                                            value={item.cantidad}
                                                            onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full rounded border-gray-300 p-1 text-sm"
                                                            value={item.precio_unitario}
                                                            onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full rounded border-gray-300 p-1 text-sm"
                                                            value={item.descuento}
                                                            onChange={(e) => handleItemChange(index, 'descuento', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <select
                                                            className="w-full rounded border-gray-300 p-1 text-sm"
                                                            value={item.codigo_porcentaje}
                                                            onChange={(e) => handleItemChange(index, 'codigo_porcentaje', e.target.value)}
                                                        >
                                                            {impuestos.map((i) => (
                                                                <option key={i.codigo_porcentaje} value={i.codigo_porcentaje}>
                                                                    {i.descripcion}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-2 font-semibold text-gray-700">${subtotalRow}</td>
                                                    <td className="p-2">
                                                        {data.items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="text-red-600 font-bold hover:text-red-800"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            >
                                + Agregar Producto
                            </button>
                        </div>

                        {/* Totales y Resumen */}
                        <div className="flex justify-end pt-4 border-t">
                            <div className="w-full md:w-1/3 space-y-2 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span>Subtotal IVA 15%:</span>
                                    <span>${subtotal15.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Subtotal IVA 0%:</span>
                                    <span>${subtotal0.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Monto IVA:</span>
                                    <span>${totalIva.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Propina:</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-24 text-right rounded border-gray-300 p-1 text-sm"
                                        value={data.propina}
                                        onChange={(e) => setData('propina', e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2">
                                    <span>Total:</span>
                                    <span>${totalPagar.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {processing ? 'Procesando...' : 'Generar Factura'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
              <FlashMessages />
        </AuthenticatedLayout>
    );
}
