import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/FlashMessages';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { ChevronDown, Loader2, Plus, Trash2, FilePlus, AlertTriangle } from 'lucide-react';

export default function Create({ auth, factura, tarifasIva = [] }) {
    // Si la tarifa por defecto no existe en las props, toma la primera o '4' (15%)
    const tarifaPorDefecto = tarifasIva.find((t) => t.porcentaje === '15.00' || t.porcentaje == 15)?.codigo_porcentaje 
        || tarifasIva[0]?.codigo_porcentaje 
        || '4';

    const { data, setData, post, processing, errors } = useForm({
        emisor_id: factura?.emisor_id || 1, // Ajustar según el emisor activo en sesión/contexto
        comprobante_id: factura?.id || '',
        cliente_id: factura?.cliente?.id || '',
        fecha_emision: new Date().toISOString().split('T')[0],
        codigo_porcentaje_iva: tarifaPorDefecto,
        motivos: [
            { razon: '', valor: 0.00 }
        ]
    });

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
        if (elapsedSeconds < 5) return 'Generando XML de Nota de Débito, firmando y transmitiendo al SRI...';
        if (elapsedSeconds < 12) return 'El Web Service del SRI está respondiendo con latencia...';
        return 'Presentando alto tráfico en el SRI. Mantén abierta esta ventana...';
    };

    const handleAddMotivo = () => {
        setData('motivos', [...data.motivos, { razon: '', valor: 0.00 }]);
    };

    const handleRemoveMotivo = (index) => {
        const updated = data.motivos.filter((_, i) => i !== index);
        setData('motivos', updated);
    };

    const handleMotivoChange = (index, field, value) => {
        const updated = [...data.motivos];
        updated[index][field] = value;
        setData('motivos', updated);
    };

    // Obtener porcentaje numérico según la tarifa seleccionada de la BD
    const tarifaSeleccionada = tarifasIva.find((t) => t.codigo_porcentaje === data.codigo_porcentaje_iva);
    const porcentajeIva = tarifaSeleccionada ? parseFloat(tarifaSeleccionada.porcentaje) : 15;

    // Cálculos dinámicos
    const subtotal = data.motivos.reduce((acc, m) => acc + (parseFloat(m.valor) || 0), 0);
    const montoIva = subtotal * (porcentajeIva / 100);
    const totalNotaDebito = subtotal + montoIva;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('notas-debito.store'));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Nueva Nota de Débito" />

            {/* Modal Overlay de Procesamiento SRI */}
            {processing && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-2xl">
                        <Loader2 className="mx-auto size-12 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Procesando Nota de Débito</h3>
                        <p className="text-sm text-gray-600">{getLoadingMessage()}</p>
                        <div className="text-xs font-mono text-gray-400">Tiempo transcurrido: {elapsedSeconds}s</div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">

                    {errors.error && (
                        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                            <AlertTriangle className="size-5 shrink-0" />
                            <span className="text-sm font-medium">{errors.error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* DOCUMENTO SUSTENTO */}
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader className="bg-primary/5 py-3 border-b">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Documento Sustento (Factura Modificada)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-3 gap-4 rounded-xl bg-secondary/30 p-4 text-sm">
                                    <div>
                                        <span className="block text-xs text-muted-foreground">Número de Factura:</span>
                                        <span className="font-mono font-bold text-primary">
                                            {factura ? `${factura.establecimiento}-${factura.punto_emision}-${factura.secuencial}` : 'Sin factura vinculada'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-muted-foreground">Cliente:</span>
                                        <span className="font-medium text-primary">
                                            {factura?.cliente?.razon_social || 'N / A'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs text-muted-foreground">Total Factura:</span>
                                        <span className="font-bold text-primary">
                                            \${factura ? parseFloat(factura.importe_total).toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* DATOS Y MOTIVOS */}
                        <Card className="border-border/60 shadow-sm">
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fecha de Emisión</Label>
                                        <Input
                                            type="date"
                                            value={data.fecha_emision}
                                            onChange={(e) => setData('fecha_emision', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tarifa de IVA</Label>
                                        <div className="relative">
                                            <select
                                                value={data.codigo_porcentaje_iva}
                                                onChange={(e) => setData('codigo_porcentaje_iva', e.target.value)}
                                                className="h-10 w-full appearance-none rounded-md border border-input bg-white pl-3 pr-8 text-sm shadow-xs outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                {tarifasIva.map((t) => (
                                                    <option key={t.id} value={t.codigo_porcentaje}>
                                                        {t.descripcion} ({parseFloat(t.porcentaje).toFixed(2)}%)
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                {/* LISTADO DINÁMICO DE MOTIVOS */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Motivos de la Nota de Débito
                                        </Label>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddMotivo}>
                                            <Plus className="size-4" /> Agregar motivo
                                        </Button>
                                    </div>

                                    {data.motivos.map((m, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <Input
                                                placeholder="Ej: Intereses por mora, penalización contractual"
                                                value={m.razon}
                                                onChange={(e) => handleMotivoChange(idx, 'razon', e.target.value)}
                                                className="flex-1"
                                                required
                                            />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={m.valor}
                                                onChange={(e) => handleMotivoChange(idx, 'valor', e.target.value)}
                                                className="w-32 text-right"
                                                required
                                            />
                                            {data.motivos.length > 1 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMotivo(idx)}>
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* TOTALES */}
                                <div className="space-y-1 text-right text-sm border-t pt-4">
                                    <div className="flex justify-end gap-8 text-muted-foreground">
                                        <span>Subtotal:</span>
                                        <span className="font-mono text-primary font-medium">\${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-end gap-8 text-muted-foreground">
                                        <span>IVA ({porcentajeIva}%):</span>
                                        <span className="font-mono text-primary font-medium">\${montoIva.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-end gap-8 font-bold text-lg text-primary pt-2">
                                        <span>Total:</span>
                                        <span className="font-mono">\${totalNotaDebito.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ACCIONES */}
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing || !data.comprobante_id}>
                                <FilePlus className="size-4" />
                                Emitir Nota de Débito
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}