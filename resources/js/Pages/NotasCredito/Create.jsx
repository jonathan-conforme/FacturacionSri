import React, { useMemo, useState, useEffect } from 'react';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';

import {
    AlertTriangle,
    CalendarDays,
    FileMinus,
    FileText,
    Loader2,
    Package,
    Receipt,
} from 'lucide-react';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const hoyLocal = () => new Date().toLocaleDateString('en-CA');

const Th = ({ children, className = '', right = false }) => (
    <TableHead
        className={`h-11 px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground ${
            right ? 'text-right' : 'text-left'
        } ${className}`}
    >
        {children}
    </TableHead>
);

export default function Create({ auth, factura }) {
    // Si por alguna razón la factura no llega, extrae los detalles de forma segura
    const detalles = factura?.detalles || [];

    const { data, setData, post, processing, errors, transform } = useForm({
        comprobante_id: factura?.id || '',
        fecha_emision: hoyLocal(),
        motivo: '',
    });

    // Estado por línea asegurado
    const [lineas, setLineas] = useState(() =>
        Object.fromEntries(
            detalles.map((d) => [d.id, { activa: true, cantidad: String(parseFloat(d.cantidad || 0)) }])
        )
    );
    const [errorLocal, setErrorLocal] = useState('');

    // Temporizador de espera SRI
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
        if (elapsedSeconds < 5) return 'Generando XML de Nota de Crédito, firmando y enviando al SRI...';
        if (elapsedSeconds < 12) return 'El servidor del SRI presenta lentitud en responder...';
        return 'Alto tráfico en el portal del SRI. Por favor no cierres esta ventana...';
    };

    const cambiarLinea = (id, cambios) =>
        setLineas((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }));

    // Estimación de totales
    const totales = useMemo(() => {
        let base = 0;
        let iva = 0;

        detalles.forEach((d) => {
            const l = lineas[d.id];
            const cantidad = parseFloat(l?.cantidad);
            if (!l?.activa || !(cantidad > 0)) return;

            const ratio = cantidad / parseFloat(d.cantidad || 1);
            const descuento = parseFloat(d.descuento || 0) * ratio;
            const subtotal = parseFloat(d.precio_unitario || 0) * cantidad - descuento;

            base += subtotal;
            iva += subtotal * (parseFloat(d.tarifa || 0) / 100);
        });

        return { base, iva, total: base + iva };
    }, [lineas, detalles]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorLocal('');

        const items = detalles
            .filter((d) => lineas[d.id]?.activa)
            .map((d) => ({ detalle_id: d.id, cantidad: parseFloat(lineas[d.id]?.cantidad || 0) }));

        if (items.length === 0) {
            setErrorLocal('Selecciona al menos una línea para acreditar.');
            return;
        }

        const excede = detalles.find(
            (d) => lineas[d.id]?.activa && parseFloat(lineas[d.id]?.cantidad || 0) > parseFloat(d.cantidad || 0)
        );
        if (excede) {
            setErrorLocal(`La cantidad de «${excede.descripcion}» supera la facturada.`);
            return;
        }

        transform((formData) => ({ ...formData, items }));
        post(route('notas-credito.store'));
    };

    if (!factura) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="p-10 text-center">
                    <p className="font-semibold text-destructive">No se encontró información de la factura.</p>
                    <Button asChild className="mt-4" variant="outline">
                        <Link href={route('facturas.index')}>Volver a Facturas</Link>
                    </Button>
                </div>
            </AuthenticatedLayout>
        );
    }

    const numeroFactura = `${factura.establecimiento}-${factura.punto_emision}-${factura.secuencial}`;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <FileMinus className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold text-primary">Nueva Nota de Crédito</h2>
                        <p className="text-xs text-muted-foreground">Comprobante electrónico tipo 04</p>
                    </div>
                </div>
            }
        >
            <Head title="Nueva Nota de Crédito" />

            {/* Modal Overlay de Procesamiento SRI */}
            {processing && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 p-4 text-center backdrop-blur-xs">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <Loader2 className="mx-auto size-12 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Procesando Nota de Crédito</h3>
                        <p className="text-sm text-gray-600">{getLoadingMessage()}</p>
                        <div className="font-mono text-xs text-gray-400">Tiempo transcurrido: {elapsedSeconds}s</div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">

                    {(errors.error || errors.items || errors.comprobante_id || errorLocal) && (
                        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                            <span className="text-sm font-medium">
                                {errors.error || errors.items || errors.comprobante_id || errorLocal}
                            </span>
                        </div>
                    )}

                    {/* DOCUMENTO SUSTENTO */}
                    <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                        <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Receipt className="size-5 text-border" />
                                Factura a Modificar (Documento Sustento)
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/80">
                                Información de la factura original sobre la cual se aplicará el descuento o devolución.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 gap-4 rounded-xl bg-secondary/30 p-4 text-sm md:grid-cols-4">
                                <div>
                                    <span className="block text-xs text-muted-foreground">Número de Factura:</span>
                                    <span className="font-mono font-bold text-primary">{numeroFactura}</span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="block text-xs text-muted-foreground">Cliente:</span>
                                    <span className="font-medium text-primary">
                                        {factura.cliente?.razon_social || 'N/A'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-muted-foreground">Total Factura:</span>
                                    <span className="font-bold text-primary">{dinero(factura.importe_total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* DATOS Y MOTIVO */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="size-5 text-border" />
                                    Datos de la Nota de Crédito
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Ingresa la fecha y especifica el motivo comercial o tributario de la modificación.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-primary">Fecha de Emisión</Label>
                                        <div className="relative">
                                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <Input
                                                type="date"
                                                className="pl-9 text-primary"
                                                value={data.fecha_emision}
                                                onChange={(e) => setData('fecha_emision', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-primary">Motivo de la Modificación</Label>
                                        <Input
                                            type="text"
                                            maxLength={300}
                                            placeholder="Ej: Devolución parcial de mercadería, error en precios"
                                            value={data.motivo}
                                            onChange={(e) => setData('motivo', e.target.value)}
                                            required
                                            className="text-primary"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* LÍNEAS A ACREDITAR */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Package className="size-5 text-border" />
                                    Líneas a Acreditar
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Marca los ítems y especifica la cantidad que deseas devolver o acreditar.
                                </CardDescription>
                            </CardHeader>

                            <Table>
                                <TableHeader className="bg-primary/90 [&_tr]:border-0">
                                    <TableRow className="border-0 hover:bg-transparent">
                                        <Th className="w-12"></Th>
                                        <Th>Descripción</Th>
                                        <Th right className="w-28">Facturado</Th>
                                        <Th right className="w-32">P. Unitario</Th>
                                        <Th right className="w-24">IVA</Th>
                                        <Th right className="w-36">Acreditar</Th>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detalles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No hay ítems disponibles en esta factura.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        detalles.map((d) => {
                                            const estaActiva = lineas[d.id]?.activa;
                                            return (
                                                <TableRow
                                                    key={d.id}
                                                    className={`border-secondary transition-colors ${
                                                        !estaActiva ? 'bg-secondary/20 text-muted-foreground' : ''
                                                    }`}
                                                >
                                                    <TableCell className="p-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="size-4 rounded border-input text-primary accent-primary focus:ring-primary"
                                                            checked={!!estaActiva}
                                                            onChange={(e) => cambiarLinea(d.id, { activa: e.target.checked })}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        <p className="font-medium text-primary">{d.descripcion}</p>
                                                        <p className="font-mono text-xs text-muted-foreground">{d.codigo_principal}</p>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right font-medium text-primary">
                                                        {parseFloat(d.cantidad || 0)}
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right font-mono text-primary">
                                                        {dinero(d.precio_unitario)}
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right font-medium text-primary">
                                                        {parseFloat(d.tarifa || 0)}%
                                                    </TableCell>
                                                    <TableCell className="p-2 text-right">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            max={parseFloat(d.cantidad || 0)}
                                                            disabled={!estaActiva}
                                                            className="ml-auto h-9 w-28 text-right font-mono text-sm"
                                                            value={lineas[d.id]?.cantidad || ''}
                                                            onChange={(e) => cambiarLinea(d.id, { cantidad: e.target.value })}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            <div className="flex justify-end border-t border-secondary p-6">
                                <div className="w-full space-y-2 text-sm md:w-72">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal:</span>
                                        <span className="font-mono font-medium text-primary">{dinero(totales.base)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Monto IVA:</span>
                                        <span className="font-mono font-medium text-primary">{dinero(totales.iva)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 text-base font-bold text-primary">
                                        <span>Total (estimado):</span>
                                        <span className="font-mono">{dinero(totales.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="flex justify-end gap-3">
                            <Button className="cursor-pointer" type="button" variant="outline" onClick={() => window.history.back()} size="lg">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing} size="lg" className="cursor-pointer" >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="size-5 animate-spin" />
                                        <span>Transmitiendo...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <FileMinus className="size-5" />
                                        <span>Emitir Nota de Crédito</span>
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}