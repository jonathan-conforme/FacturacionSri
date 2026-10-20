import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';

import {
    AlertCircle,
    CalendarDays,
    ChevronDown,
    CircleDollarSign,
    FileMinus,
    FilePlus,
    FileText,
    Filter,
    Hash,
    Inbox,
    Search,
    ShieldCheck,
    UserRound,
    Wrench,
} from 'lucide-react';

/* Encabezado de columna con icono */
const Th = ({ icon: Icon, children, center = false }) => (
    <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
        <span className={`inline-flex items-center gap-2 ${center ? 'w-full justify-center' : ''}`}>
            <Icon className="size-4 text-border" />
            {children}
        </span>
    </TableHead>
);

export default function Index({ comprobantes, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [estado, setEstado] = useState(filters.estado || '');

    const obtenerMensajes = (mensajesRaw) => {
        if (!mensajesRaw) return [];
        try {
            const parsed = JSON.parse(mensajesRaw);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            return [mensajesRaw];
        }
    };

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('facturas.index'), { search, estado }, { preserveState: true });
    };

    //obtener hora 
    const obtenerHora = (createdAt) => {
    if (!createdAt) return '';
    const fecha = new Date(createdAt);
    return fecha.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Muestra 10:18 PM / AM
    });
};

    // Badge para Estado SRI
    const getEstadoBadge = (estadoSri) => {
        const styles = {
            AUTORIZADO: 'border-primary bg-primary text-primary-foreground',
            DEVUELTA: 'border-destructive/40 bg-destructive/10 text-destructive',
            RECIBIDA: 'border-border bg-border/30 text-primary',
            CREADO: 'border-border bg-secondary text-primary',
            NO_AUTORIZADO: 'border-destructive/40 bg-destructive/10 text-destructive',
            ERROR: 'border-destructive/40 bg-destructive/10 text-destructive',
            PENDIENTE: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
        };
        return (
            <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[estadoSri] || styles.CREADO}`}>
                {estadoSri || 'PENDIENTE'}
            </Badge>
        );
    };

    // Badge para Tipo de Comprobante
    const getTipoBadge = (tipo) => {
        const tipos = {
            '01': { label: 'Factura', style: 'border-blue-500/40 bg-blue-500/10 text-blue-700' },
            '04': { label: 'Nota Crédito', style: 'border-purple-500/40 bg-purple-500/10 text-purple-700' },
            '05': { label: 'Nota Débito', style: 'border-amber-500/40 bg-amber-500/10 text-amber-700' },
        };
        const config = tipos[tipo] || { label: `Cod. ${tipo}`, style: 'border-border bg-secondary text-primary' };
        
        return (
            <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs font-semibold ${config.style}`}>
                {config.label}
            </Badge>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <FileText className="size-5" />
                    </span>
                    <h2 className="text-xl font-semibold text-primary">Comprobantes Electrónicos</h2>
                </div>
            }
        >
            <Head title="Comprobantes" />

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">

                        {/* FILTROS DE BÚSQUEDA */}
                        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3 border-b border-border/40 p-4">
                            <div className="relative w-full sm:w-80">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por cliente, RUC o clave..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-secondary/40 pl-9 text-primary"
                                />
                            </div>

                            <div className="relative">
                                <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                <select
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                    className="h-9 appearance-none rounded-md border border-input bg-secondary/40 pl-9 pr-9 text-sm text-primary shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="PENDIENTE">PENDIENTE</option>
                                    <option value="RECIBIDA">RECIBIDA</option>
                                    <option value="AUTORIZADO">AUTORIZADO</option>
                                    <option value="DEVUELTA">DEVUELTA</option>
                                    <option value="NO_AUTORIZADO">NO AUTORIZADO</option>
                                    <option value="ERROR">ERROR</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                            </div>

                            <Button type="submit">
                                <Search className="size-4" />
                                Filtrar
                            </Button>
                        </form>

                        {/* TABLA DE COMPROBANTES */}
                        <Table>
                            <TableHeader className="bg-primary [&_tr]:border-0">
                                <TableRow className="border-0 hover:bg-primary">
                                    <Th icon={FileText}>Tipo</Th>
                                    <Th icon={Hash}>Secuencial</Th>
                                    <Th icon={UserRound}>Cliente</Th>
                                    <Th icon={CalendarDays}>Fecha</Th>
                                    <Th icon={CircleDollarSign}>Total</Th>
                                    <Th icon={ShieldCheck}>Estado SRI</Th>
                                    <Th icon={AlertCircle}>Mensajes / Errores</Th>
                                    <Th icon={Wrench} center>Acciones</Th>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {comprobantes.data.length === 0 && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="py-14 text-center">
                                            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
                                                <Inbox className="size-7" />
                                            </span>
                                            <p className="mt-4 font-semibold text-primary">No hay comprobantes</p>
                                            <p className="mt-1 text-sm text-primary/70">
                                                Prueba cambiando los filtros de búsqueda.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {comprobantes.data.map((c) => (
                                    <TableRow key={c.id} className="border-secondary">
                                        <TableCell className="px-4 py-3">
                                            {getTipoBadge(c.tipo_comprobante)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 font-mono font-medium text-primary">
                                            {c.establecimiento}-{c.punto_emision}-{c.secuencial}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-primary">{c.cliente?.razon_social || 'N/A'}</TableCell>
                                        <div className="font-medium">{c.fecha_emision}</div>
    {c.created_at && (
        <span className="text-xs text-muted-foreground font-mono">
            {obtenerHora(c.created_at)}
        </span>
    )}
                                        <TableCell className="px-4 py-3 font-bold text-primary">\${c.importe_total}</TableCell>
                                        <TableCell className="px-4 py-3">{getEstadoBadge(c.estado_sri)}</TableCell>
                                        <TableCell className="max-w-xs truncate px-4 py-3 text-xs text-destructive" title={c.mensajes_sri ? obtenerMensajes(c.mensajes_sri).join(', ') : ''}>
                                            {c.mensajes_sri ? obtenerMensajes(c.mensajes_sri).join(', ') : '-'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Mostrar opciones de Nota de Crédito/Débito principalmente a Facturas (01) */}
                                                {c.tipo_comprobante === '01' && (
                                                    <>
                                                        <Button asChild variant="secondary" size="sm" className="border border-border text-primary hover:bg-border/40">
                                                            <Link href={route('notas-credito.create', { factura: c.id })}>
                                                                <FileMinus className="size-3.5" />
                                                                N. Crédito
                                                            </Link>
                                                        </Button>

                                                        <Button asChild variant="secondary" size="sm" className="border border-border text-primary hover:bg-border/40">
                                                            <Link href={route('notas-debito.create', { factura: c.id })}>
                                                                <FilePlus className="size-3.5" />
                                                                N. Débito
                                                            </Link>
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* PAGINACIÓN */}
                        {comprobantes.links && comprobantes.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 p-4 bg-secondary/10">
                                <span className="text-sm text-primary/70">
                                    Mostrando {comprobantes.from || 0} a {comprobantes.to || 0} de {comprobantes.total || 0} resultados
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {comprobantes.links.map((link, key) => (
                                        link.url ? (
                                            <Link
                                                key={key}
                                                href={link.url}
                                                preserveState
                                                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                                                    link.active
                                                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                                                        : 'bg-white text-primary border-input hover:bg-secondary'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={key}
                                                className="px-3 py-1.5 text-xs rounded-md border border-input/40 bg-secondary/30 text-primary/40 cursor-not-allowed"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}