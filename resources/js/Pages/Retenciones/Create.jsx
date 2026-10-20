import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/FlashMessages';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { ChevronDown, Loader2, Plus, Trash2, FileCheck, AlertTriangle } from 'lucide-react';

export default function Create({ auth, proveedores = [], emisores = [], facturaSustento = null }) {
    const today = new Date().toISOString().split('T')[0];

    // Helper para formatear periodo fiscal MM/YYYY a partir de una fecha
    const formatPeriodoFiscal = (dateString) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        return `${month}/${year}`;
    };

    // 1. Definir emisor inicial de forma segura
    const emisorInicial = emisores[0] || null;

    // 2. Estado del formulario Inertia
    const { data, setData, post, processing, errors } = useForm({
        emisor_id: emisorInicial?.id || '',
        cliente_id: facturaSustento?.cliente_id || proveedores[0]?.id || '',
        fecha_emision: today,
        periodo_fiscal: formatPeriodoFiscal(today),
        establecimiento: emisorInicial?.codigo_establecimiento || emisorInicial?.establecimiento || '001',
        punto_emision: emisorInicial?.punto_emision || '001',
        detalles: [
            {
                cod_sustento: '01',
                cod_doc_sustento: '01', // 01: Factura
                num_doc_sustento: facturaSustento
                    ? `${facturaSustento.establecimiento}-${facturaSustento.punto_emision}-${facturaSustento.secuencial}`
                    : '',
                fecha_emision_doc_sustento: facturaSustento?.fecha_emision || today,
                codigo_impuesto: '1', // 1: Renta, 2: IVA
                codigo_retencion: '312',
                base_imponible: 0.00,
                porcentaje_retener: 1.75,
            }
        ]
    });

    // 3. Cambiar de emisor y sincronizar datos de establecimiento/punto emisión
    const handleEmisorChange = (emisorId) => {
        const emisor = emisores.find((e) => e.id === parseInt(emisorId));
        setData((prev) => ({
            ...prev,
            emisor_id: emisorId,
            establecimiento: emisor?.codigo_establecimiento || emisor?.establecimiento || '001',
            punto_emision: emisor?.punto_emision || '001',
        }));
    };

    // Control de overlay y tiempos de espera para la comunicación con el SRI
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        let interval = null;
        if (processing) {
            setElapsedSeconds(0);
            interval = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [processing]);

    const getLoadingMessage = () => {
        if (elapsedSeconds < 5) return 'Generando XML de Retención, firmando y transmitiendo al SRI...';
        if (elapsedSeconds < 12) return 'El Web Service del SRI está respondiendo con latencia...';
        return 'Presentando alto tráfico en el SRI. Mantén abierta esta ventana...';
    };

    // Actualizar fecha de emisión y sincronizar el periodo fiscal
    const handleFechaEmisionChange = (e) => {
        const nuevaFecha = e.target.value;
        setData((prev) => ({
            ...prev,
            fecha_emision: nuevaFecha,
            periodo_fiscal: formatPeriodoFiscal(nuevaFecha),
        }));
    };

    const handleAddDetalle = () => {
        setData('detalles', [
            ...data.detalles,
            {
                cod_sustento: '01',
                cod_doc_sustento: '01',
                num_doc_sustento: data.detalles[0]?.num_doc_sustento || '',
                fecha_emision_doc_sustento: data.detalles[0]?.fecha_emision_doc_sustento || today,
                codigo_impuesto: '1',
                codigo_retencion: '312',
                base_imponible: 0.00,
                porcentaje_retener: 1.75,
            }
        ]);
    };

    const handleRemoveDetalle = (index) => {
        const updated = data.detalles.filter((_, i) => i !== index);
        setData('detalles', updated);
    };

    const handleDetalleChange = (index, field, value) => {
        const updated = [...data.detalles];
        updated[index][field] = value;
        setData('detalles', updated);
    };

    // Cálculos dinámicos
    const totalBaseImponible = data.detalles.reduce((acc, d) => acc + (parseFloat(d.base_imponible) || 0), 0);
    const totalRetenido = data.detalles.reduce((acc, d) => {
        const base = parseFloat(d.base_imponible) || 0;
        const porcentaje = parseFloat(d.porcentaje_retener) || 0;
        return acc + (base * (porcentaje / 100));
    }, 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('retenciones.store'));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Nuevo Comprobante de Retención" />

            {/* Modal Overlay de Procesamiento SRI */}
            {processing && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-2xl">
                        <Loader2 className="mx-auto size-12 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Procesando Comprobante de Retención</h3>
                        <p className="text-sm text-gray-600">{getLoadingMessage()}</p>
                        <div className="text-xs font-mono text-gray-400">Tiempo transcurrido: {elapsedSeconds}s</div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">

                    {errors.error && (
                        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                            <AlertTriangle className="size-5 shrink-0" />
                            <span className="text-sm font-medium">{errors.error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* DATOS GENERALES Y SUJETO RETENIDO */}
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader className="bg-primary/5 py-3 border-b">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Información del Comprobante y Sujeto Retenido (Proveedor)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Selector de Emisor */}
                                    {emisores.length > 1 && (
                                        <div className="space-y-2 md:col-span-1">
                                            <Label>Emisor</Label>
                                            <div className="relative">
                                                <select
                                                    value={data.emisor_id}
                                                    onChange={(e) => handleEmisorChange(e.target.value)}
                                                    className="h-10 w-full appearance-none rounded-md border border-input bg-white pl-3 pr-8 text-sm shadow-xs outline-none focus:ring-2 focus:ring-primary"
                                                    required
                                                >
                                                    {emisores.map((e) => (
                                                        <option key={e.id} value={e.id}>
                                                            {e.razon_social} ({e.codigo_establecimiento || e.establecimiento}-{e.punto_emision})
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Selector de Proveedor */}
                                    <div className={`space-y-2 ${emisores.length > 1 ? 'md:col-span-1' : 'md:col-span-2'}`}>
                                        <Label>Sujeto Retenido / Proveedor</Label>
                                        <div className="relative">
                                            <select
                                                value={data.cliente_id}
                                                onChange={(e) => setData('cliente_id', e.target.value)}
                                                className="h-10 w-full appearance-none rounded-md border border-input bg-white pl-3 pr-8 text-sm shadow-xs outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            >
                                                <option value="">Seleccione un proveedor...</option>
                                                {proveedores.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.razon_social} ({p.identificacion})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        </div>
                                    </div>

                                    {/* Fecha de Emisión */}
                                    <div className="space-y-2">
                                        <Label>Fecha de Emisión</Label>
                                        <Input
                                            type="date"
                                            value={data.fecha_emision}
                                            onChange={handleFechaEmisionChange}
                                            required
                                        />
                                    </div>

                                    {/* Período Fiscal */}
                                    <div className="space-y-2">
                                        <Label>Período Fiscal (MM/YYYY)</Label>
                                        <Input
                                            type="text"
                                            value={data.periodo_fiscal}
                                            onChange={(e) => setData('periodo_fiscal', e.target.value)}
                                            placeholder="MM/YYYY"
                                            maxLength="7"
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* DETALLE DE IMPUESTOS A RETENER */}
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Impuestos Retenidos
                                    </Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddDetalle}>
                                        <Plus className="size-4" /> Agregar Impuesto
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {data.detalles.map((det, idx) => {
                                        const valorRetenido = (
                                            (parseFloat(det.base_imponible) || 0) *
                                            ((parseFloat(det.porcentaje_retener) || 0) / 100)
                                        ).toFixed(2);

                                        return (
                                            <div key={idx} className="p-4 rounded-xl border border-border/60 bg-secondary/10 space-y-3">
                                                {/* Fila 1: Documento Sustento */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Tipo Doc. Sustento</Label>
                                                        <div className="relative mt-1">
                                                            <select
                                                                value={det.cod_doc_sustento}
                                                                onChange={(e) => handleDetalleChange(idx, 'cod_doc_sustento', e.target.value)}
                                                                className="h-9 w-full appearance-none rounded-md border border-input bg-white pl-2 pr-7 text-xs shadow-xs outline-none focus:ring-2 focus:ring-primary"
                                                            >
                                                                <option value="01">Factura (01)</option>
                                                                <option value="05">Nota de Débito (05)</option>
                                                            </select>
                                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Num. Doc Sustento</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="001-001-000000123"
                                                            value={det.num_doc_sustento}
                                                            onChange={(e) => handleDetalleChange(idx, 'num_doc_sustento', e.target.value)}
                                                            className="h-9 text-xs mt-1"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">Fecha Doc Sustento</Label>
                                                        <Input
                                                            type="date"
                                                            value={det.fecha_emision_doc_sustento}
                                                            onChange={(e) => handleDetalleChange(idx, 'fecha_emision_doc_sustento', e.target.value)}
                                                            className="h-9 text-xs mt-1"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Fila 2: Datos de la Retención */}
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2 border-t border-border/40">
                                                    <div className="md:col-span-3">
                                                        <Label className="text-xs text-muted-foreground">Impuesto</Label>
                                                        <div className="relative mt-1">
                                                            <select
                                                                value={det.codigo_impuesto}
                                                                onChange={(e) => handleDetalleChange(idx, 'codigo_impuesto', e.target.value)}
                                                                className="h-9 w-full appearance-none rounded-md border border-input bg-white pl-2 pr-7 text-xs shadow-xs outline-none focus:ring-2 focus:ring-primary"
                                                            >
                                                                <option value="1">RENTA</option>
                                                                <option value="2">IVA</option>
                                                                <option value="6">ISD</option>
                                                            </select>
                                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                                        </div>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <Label className="text-xs text-muted-foreground">Cod. Retención</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="312 / 2"
                                                            value={det.codigo_retencion}
                                                            onChange={(e) => handleDetalleChange(idx, 'codigo_retencion', e.target.value)}
                                                            className="h-9 text-xs mt-1 font-mono"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <Label className="text-xs text-muted-foreground">Base Imponible</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={det.base_imponible}
                                                            onChange={(e) => handleDetalleChange(idx, 'base_imponible', e.target.value)}
                                                            className="h-9 text-xs mt-1 text-right font-mono"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <Label className="text-xs text-muted-foreground">% Retención</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="1.75"
                                                            value={det.porcentaje_retener}
                                                            onChange={(e) => handleDetalleChange(idx, 'porcentaje_retener', e.target.value)}
                                                            className="h-9 text-xs mt-1 text-right font-mono"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2 text-right">
                                                        <Label className="text-xs text-muted-foreground block mb-1">Valor Retenido</Label>
                                                        <div className="h-9 flex items-center justify-end px-3 rounded-md bg-secondary/50 font-mono font-bold text-sm text-primary">
                                                            \${valorRetenido}
                                                        </div>
                                                    </div>

                                                    <div className="md:col-span-1 flex justify-end">
                                                        {data.detalles.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveDetalle(idx)}
                                                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* TOTALES */}
                                <div className="space-y-1 text-right text-sm border-t pt-4">
                                    <div className="flex justify-end gap-8 text-muted-foreground">
                                        <span>Total Base Imponible:</span>
                                        <span className="font-mono text-primary font-medium">\${totalBaseImponible.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-end gap-8 font-bold text-lg text-primary pt-2">
                                        <span>Total Retenido:</span>
                                        <span className="font-mono">\${totalRetenido.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ACCIONES */}
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing || !data.cliente_id || data.detalles.length === 0}>
                                <FileCheck className="size-4" />
                                Emitir Comprobante de Retención
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}
