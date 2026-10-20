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
    FileCheck2,
    FileText,
    Loader2,
    MapPin,
    Package,
    Plus,
    Route,
    Trash2,
    Truck,
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

export default function Create({ auth, emisores = [], clientes = [], comprobantes = [], siguienteSecuencial = '000000001' }) {
    const { data, setData, post, processing, errors } = useForm({
        emisor_id: emisores[0]?.id || '',
        cliente_id: '',
        comprobante_id: '',
        establecimiento: emisores[0]?.codigo_establecimiento || '001',
        punto_emision: emisores[0]?.punto_emision || '001',
        secuencial: siguienteSecuencial, // <--- Carga el siguiente número autocalculado
        fecha_emision: new Date().toISOString().split('T')[0],

        // Datos del Transporte
        dir_partida: emisores[0]?.dir_matriz || '',
        tipo_identificacion_transportista: '04',
        identificacion_transportista: '',
        razon_social_transportista: '',
        placa: '',
        fecha_inicio_transporte: new Date().toISOString().split('T')[0],
        fecha_fin_transporte: new Date().toISOString().split('T')[0],

        // Destino y Documento Sustento
        dir_destinatario: '',
        motivo_traslado: 'Traslado de mercadería',
        ruta: '',
        cod_doc_sustento: '01',
        num_doc_sustento: '',
        num_aut_doc_sustento: '',
        fecha_emision_doc_sustento: '',

        // Detalles de bienes trasladados
        detalles: [
            {
                codigo_interno: 'PROD001',
                codigo_adicional: '',
                descripcion: '',
                cantidad: 1,
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

    const getLoadingMessage = () => {
        if (elapsedSeconds < 5) {
            return 'Generando XML, firmando digitalmente y enviando al SRI...';
        } else if (elapsedSeconds < 12) {
            return 'El servidor del SRI está respondiendo con lentitud. Por favor no cierres la página...';
        } else {
            return 'El portal del SRI presenta un alto tráfico en este momento. Continuamos procesando la autorización...';
        }
    };

    const handleAddDetalle = () => {
        setData('detalles', [
            ...data.detalles,
            {
                codigo_interno: '',
                codigo_adicional: '',
                descripcion: '',
                cantidad: 1,
            },
        ]);
    };

    const handleRemoveDetalle = (index) => {
        const updatedDetalles = data.detalles.filter((_, i) => i !== index);
        setData('detalles', updatedDetalles);
    };

    const handleDetalleChange = (index, field, value) => {
        const updatedDetalles = [...data.detalles];
        updatedDetalles[index][field] = value;
        setData('detalles', updatedDetalles);
    };

    const handleSeleccionarComprobante = (e) => {
        const compId = e.target.value;
        const comp = comprobantes.find((c) => String(c.id) === String(compId));

        if (comp) {
            setData((prev) => ({
                ...prev,
                comprobante_id: compId,
                cliente_id: comp.cliente_id || prev.cliente_id,
                num_doc_sustento: `${String(comp.establecimiento).padStart(3, '0')}-${String(comp.punto_emision).padStart(3, '0')}-${String(comp.secuencial).padStart(9, '0')}`,
                num_aut_doc_sustento: comp.clave_acceso || '',
                fecha_emision_doc_sustento: comp.fecha_emision || '',
            }));
        } else {
            setData((prev) => ({
                ...prev,
                comprobante_id: '',
                num_doc_sustento: '',
                num_aut_doc_sustento: '',
                fecha_emision_doc_sustento: '',
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('guias.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <Truck className="size-5" />
                    </span>
                    <h2 className="text-xl font-semibold leading-tight text-primary">Emitir Guía de Remisión</h2>
                </div>
            }
        >
            <Head title="Crear Guía de Remisión" />

            {/* Overlay de Carga Modal */}
            {processing && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-center">
                            <Loader2 className="size-12 animate-spin text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">Procesando Guía de Remisión</h3>
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
                        {/* 1. Cabecera del Comprobante y Emisor */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="size-5 text-border" />
                                    Datos de la Guía y Emisor
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Configura la numeración oficial y fecha de emisión.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-primary">Emisor</Label>
                                        <div className="relative">
                                            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <select
                                                className={selectClass}
                                                value={data.emisor_id}
                                                onChange={(e) => {
                                                    const emisorSel = emisores.find((em) => String(em.id) === e.target.value);
                                                    setData((prev) => ({
                                                        ...prev,
                                                        emisor_id: e.target.value,
                                                        establecimiento: emisorSel?.codigo_establecimiento || prev.establecimiento,
                                                        punto_emision: emisorSel?.punto_emision || prev.punto_emision,
                                                        dir_partida: emisorSel?.dir_matriz || prev.dir_partida,
                                                    }));
                                                }}
                                                required
                                            >
                                                {emisores.map((em) => (
                                                    <option key={em.id} value={em.id}>
                                                        {em.ruc} - {em.razon_social}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Establecimiento</Label>
                                        <Input
                                            type="text"
                                            maxLength="3"
                                            className="text-primary font-mono text-center"
                                            value={data.establecimiento}
                                            onChange={(e) => setData('establecimiento', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Punto Emisión</Label>
                                        <Input
                                            type="text"
                                            maxLength="3"
                                            className="text-primary font-mono text-center"
                                            value={data.punto_emision}
                                            onChange={(e) => setData('punto_emision', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Secuencial</Label>
                                        <Input
                                            type="text"
                                            readOnly
                                            maxLength="9"
                                            className="text-primary font-mono text-center"
                                            value={data.secuencial}
                                            onChange={(e) => setData('secuencial', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Datos del Transportista y Vehículo */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Truck className="size-5 text-border" />
                                    Datos del Transportista y Traslado
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Información del conductor, vehículo, vigencia y punto de partida.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-primary">Tipo Identificación</Label>
                                        <div className="relative">
                                            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <select
                                                className={selectClass}
                                                value={data.tipo_identificacion_transportista}
                                                onChange={(e) => setData('tipo_identificacion_transportista', e.target.value)}
                                                required
                                            >
                                                <option value="04">RUC</option>
                                                <option value="05">Cédula</option>
                                                <option value="06">Pasaporte</option>
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Identificación Transportista</Label>
                                        <Input
                                            type="text"
                                            className="text-primary font-mono"
                                            value={data.identificacion_transportista}
                                            onChange={(e) => setData('identificacion_transportista', e.target.value)}
                                            placeholder="1712345678001"
                                            required
                                        />
                                        {errors.identificacion_transportista && (
                                            <span className="text-sm text-destructive">{errors.identificacion_transportista}</span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Razón Social Transportista</Label>
                                        <Input
                                            type="text"
                                            className="text-primary"
                                            value={data.razon_social_transportista}
                                            onChange={(e) => setData('razon_social_transportista', e.target.value)}
                                            placeholder="Nombre o Empresa de Transporte"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-primary">Placa del Vehículo</Label>
                                        <Input
                                            type="text"
                                            className="text-primary font-mono uppercase"
                                            value={data.placa}
                                            onChange={(e) => setData('placa', e.target.value.toUpperCase())}
                                            placeholder="ABC-1234"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Fecha Inicio Traslado</Label>
                                        <div className="relative">
                                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <Input
                                                type="date"
                                                className="pl-9 text-primary"
                                                value={data.fecha_inicio_transporte}
                                                onChange={(e) => setData('fecha_inicio_transporte', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Fecha Fin Traslado</Label>
                                        <div className="relative">
                                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <Input
                                                type="date"
                                                className="pl-9 text-primary"
                                                value={data.fecha_fin_transporte}
                                                onChange={(e) => setData('fecha_fin_transporte', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-primary">Dirección de Partida</Label>
                                    <div className="relative">
                                        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                        <Input
                                            type="text"
                                            className="pl-9 text-primary"
                                            value={data.dir_partida}
                                            onChange={(e) => setData('dir_partida', e.target.value)}
                                            placeholder="Lugar de origen del cargamento"
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Destinatario y Documento de Sustento */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="size-5 text-border" />
                                    Destinatario y Documento Sustento
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Asigna el cliente receptor y la factura o documento de soporte.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-primary">Factura de Sustento (Opcional)</Label>
                                        <div className="relative">
                                            <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <select
                                                className={selectClass}
                                                value={data.comprobante_id}
                                                onChange={handleSeleccionarComprobante}
                                            >
                                                <option value="">-- Sin Factura Asociada --</option>
                                                {comprobantes.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        Factura {c.establecimiento}-{c.punto_emision}-{c.secuencial} ({c.fecha_emision})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Destinatario / Cliente</Label>
                                        <div className="relative">
                                            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <select
                                                className={selectClass}
                                                value={data.cliente_id}
                                                onChange={(e) => {
                                                    const cli = clientes.find((c) => String(c.id) === e.target.value);
                                                    setData((prev) => ({
                                                        ...prev,
                                                        cliente_id: e.target.value,
                                                        dir_destinatario: cli?.direccion || prev.dir_destinatario,
                                                    }));
                                                }}
                                                required
                                            >
                                                <option value="">-- Seleccione un Destinatario --</option>
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
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-primary">Dirección de Destino</Label>
                                        <Input
                                            type="text"
                                            className="text-primary"
                                            value={data.dir_destinatario}
                                            onChange={(e) => setData('dir_destinatario', e.target.value)}
                                            placeholder="Dirección exacta de entrega"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Motivo del Traslado</Label>
                                        <Input
                                            type="text"
                                            className="text-primary"
                                            value={data.motivo_traslado}
                                            onChange={(e) => setData('motivo_traslado', e.target.value)}
                                            placeholder="Venta, Consignación, Traslado interno, etc."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-primary">Ruta (Opcional)</Label>
                                        <div className="relative">
                                            <Route className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                            <Input
                                                type="text"
                                                className="pl-9 text-primary"
                                                value={data.ruta}
                                                onChange={(e) => setData('ruta', e.target.value)}
                                                placeholder="Ej: Quito - Guayaquil (Vía Aloag)"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">N° Doc. Sustento</Label>
                                        <Input
                                            type="text"
                                            className="text-primary font-mono"
                                            value={data.num_doc_sustento}
                                            onChange={(e) => setData('num_doc_sustento', e.target.value)}
                                            placeholder="001-001-000000001"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-primary">Fecha Emisión Sustento</Label>
                                        <Input
                                            type="date"
                                            className="text-primary"
                                            value={data.fecha_emision_doc_sustento}
                                            onChange={(e) => setData('fecha_emision_doc_sustento', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. Detalle de Ítems Trasladados */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Package className="size-5 text-border" />
                                    Detalle de Bienes Transportados
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Especifica la cantidad y descripción de los productos a movilizar.
                                </CardDescription>
                            </CardHeader>

                            <Table>
                                <TableHeader className="bg-primary/90 [&_tr]:border-0">
                                    <TableRow className="border-0 hover:bg-transparent">
                                        <Th className="w-40">Cód. Interno</Th>
                                        <Th className="w-40">Cód. Auxiliar</Th>
                                        <Th>Descripción del Artículo</Th>
                                        <Th className="w-32">Cantidad</Th>
                                        <Th className="w-16"></Th>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.detalles.map((det, index) => (
                                        <TableRow key={index} className="border-secondary">
                                            <TableCell className="p-2">
                                                <Input
                                                    type="text"
                                                    className={`${cellInput} font-mono`}
                                                    value={det.codigo_interno}
                                                    onChange={(e) => handleDetalleChange(index, 'codigo_interno', e.target.value)}
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="text"
                                                    className={`${cellInput} font-mono`}
                                                    value={det.codigo_adicional}
                                                    onChange={(e) => handleDetalleChange(index, 'codigo_adicional', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="text"
                                                    className={cellInput}
                                                    value={det.descripcion}
                                                    onChange={(e) => handleDetalleChange(index, 'descripcion', e.target.value)}
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    step="0.000001"
                                                    className={cellInput}
                                                    value={det.cantidad}
                                                    onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell className="p-2 text-center">
                                                {data.detalles.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveDetalle(index)}
                                                        aria-label="Quitar producto"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="border-t border-secondary p-4">
                                <Button
                                    type="button"
                                    onClick={handleAddDetalle}
                                    variant="secondary"
                                    size="sm"
                                    className="border border-border text-primary hover:bg-border/40"
                                >
                                    <Plus />
                                    Agregar Artículo
                                </Button>
                            </div>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing} size="lg">
                                {processing ? <Loader2 className="animate-spin" /> : <FileCheck2 />}
                                {processing ? 'Procesando...' : 'Generar Guía de Remisión'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}