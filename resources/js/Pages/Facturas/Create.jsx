import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/FlashMessages';
import { Head, useForm } from '@inertiajs/react';

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
    ChevronDown,
    Coins,
    FileCheck2,
    Loader2,
    Package,
    Plus,
    Receipt,
    Trash2,
    UserRound,
} from 'lucide-react';

/* ---------- Solo presentación ---------- */
const Th = ({ children, className = '' }) => (
    <TableHead className={`h-11 px-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground ${className}`}>
        {children}
    </TableHead>
);

const selectClass =
    'h-9 w-full appearance-none rounded-md border border-input bg-white pl-9 pr-9 text-sm text-primary shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

const cellInput = 'h-9 text-sm text-primary';

const Fila = ({ label, value, destacado = false }) => (
    <div
        className={
            destacado
                ? 'mt-1 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-lg font-bold text-primary-foreground'
                : 'flex justify-between text-sm text-primary'
        }
    >
        <span>{label}</span>
        <span className={destacado ? '' : 'font-medium tabular-nums'}>{value}</span>
    </div>
);

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

    // Estado para controlar el tiempo transcurrido durante la petición
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        let interval = null;
        if (processing) {
            setElapsedSeconds(0);
            interval = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }
        return () => clearInterval(interval);
    }, [processing]);

    // Mensaje dinámico según los segundos que lleva procesando
    const getLoadingMessage = () => {
        if (elapsedSeconds < 5) {
            return 'Generando XML, firmando digitalmente y enviando al SRI...';
        } else if (elapsedSeconds < 12) {
            return 'El servidor del SRI está respondiendo con lentitud. Por favor no cierres la página...';
        } else {
            return 'El portal del SRI presenta un alto tráfico en este momento. Continuamos procesando la autorización...';
        }
    };

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
            header={
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <Receipt className="size-5" />
                    </span>
                    <h2 className="text-xl font-semibold leading-tight text-primary">Emitir Nueva Factura</h2>
                </div>
            }
        >
            <Head title="Crear Factura" />

            {/* Overlay de Carga Modal */}
            {processing && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-center">
                            <Loader2 className="size-12 animate-spin text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">Procesando Comprobante</h3>
                        <p className="text-sm text-gray-600 transition-all duration-300">
                            {getLoadingMessage()}
                        </p>
                        <div className="text-xs font-mono text-gray-400">
                            Tiempo transcurrido: {elapsedSeconds}s
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {errors.error && (
                        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                            <span className="text-sm font-medium">{errors.error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Cabecera de Datos */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UserRound className="size-5 text-border" />
                                    Datos de la factura
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Selecciona el cliente y la fecha de emisión.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-primary">Cliente</Label>
                                        <div className="relative">
                                            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <select
                                                className={selectClass}
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
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                        </div>
                                        {errors.cliente_id && (
                                            <span className="text-sm text-destructive">{errors.cliente_id}</span>
                                        )}
                                    </div>

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
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detalles de la Factura */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Package className="size-5 text-border" />
                                    Detalle de Productos
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Agrega los productos o servicios a facturar.
                                </CardDescription>
                            </CardHeader>

                            <Table>
                                <TableHeader className="bg-primary/90 [&_tr]:border-0">
                                    <TableRow className="border-0 hover:bg-transparent">
                                        <Th>Código</Th>
                                        <Th>Descripción</Th>
                                        <Th className="w-24">Cant.</Th>
                                        <Th className="w-32">P. Unitario</Th>
                                        <Th className="w-28">Desc.</Th>
                                        <Th className="w-44">Impuesto</Th>
                                        <Th>Subtotal</Th>
                                        <Th></Th>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.map((item, index) => {
                                        const cant = parseFloat(item.cantidad) || 0;
                                        const pu = parseFloat(item.precio_unitario) || 0;
                                        const desc = parseFloat(item.descuento) || 0;
                                        const subtotalRow = (cant * pu - desc).toFixed(2);

                                        return (
                                            <TableRow key={index} className="border-secondary">
                                                <TableCell className="p-2">
                                                    <Input
                                                        type="text"
                                                        className={`${cellInput} font-mono`}
                                                        value={item.codigo_principal}
                                                        onChange={(e) => handleItemChange(index, 'codigo_principal', e.target.value)}
                                                        required
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input
                                                        type="text"
                                                        className={cellInput}
                                                        value={item.descripcion}
                                                        onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                                                        required
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className={cellInput}
                                                        value={item.cantidad}
                                                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                                                        required
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className={cellInput}
                                                        value={item.precio_unitario}
                                                        onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                                                        required
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className={cellInput}
                                                        value={item.descuento}
                                                        onChange={(e) => handleItemChange(index, 'descuento', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <div className="relative">
                                                        <select
                                                            className="h-9 w-full appearance-none rounded-md border border-input bg-white pl-3 pr-8 text-sm text-primary shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                            value={item.codigo_porcentaje}
                                                            onChange={(e) => handleItemChange(index, 'codigo_porcentaje', e.target.value)}
                                                        >
                                                            {impuestos.map((i) => (
                                                                <option key={i.codigo_porcentaje} value={i.codigo_porcentaje}>
                                                                    {i.descripcion}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-border" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-2 font-semibold tabular-nums text-primary">\${subtotalRow}</TableCell>
                                                <TableCell className="p-2">
                                                    {data.items.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveItem(index)}
                                                            aria-label="Quitar producto"
                                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            <div className="border-t border-secondary p-4">
                                <Button
                                    type="button"
                                    onClick={handleAddItem}
                                    variant="secondary"
                                    size="sm"
                                    className="border border-border text-primary hover:bg-border/40"
                                >
                                    <Plus />
                                    Agregar Producto
                                </Button>
                            </div>
                        </Card>

                        {/* Totales y Resumen */}
                        <div className="flex justify-end">
                            <Card className="w-full gap-0 border-border/60 py-0 shadow-sm md:w-1/3">
                                <CardContent className="space-y-3 p-5">
                                    <Fila label="Subtotal IVA 15%:" value={`$${subtotal15.toFixed(2)}`} />
                                    <Fila label="Subtotal IVA 0%:" value={`$${subtotal0.toFixed(2)}`} />
                                    <Fila label="Monto IVA:" value={`$${totalIva.toFixed(2)}`} />
                                    <div className="flex items-center justify-between text-sm text-primary">
                                        <span className="inline-flex items-center gap-2">
                                            <Coins className="size-4 text-border" />
                                            Propina:
                                        </span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-9 w-28 text-right text-sm text-primary"
                                            value={data.propina}
                                            onChange={(e) => setData('propina', e.target.value)}
                                        />
                                    </div>
                                    <Fila label="Total:" value={`$${totalPagar.toFixed(2)}`} destacado />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing} size="lg">
                                {processing ? <Loader2 className="animate-spin" /> : <FileCheck2 />}
                                {processing ? 'Procesando...' : 'Generar Factura'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}