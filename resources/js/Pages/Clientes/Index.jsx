import React, { useMemo, useState } from 'react';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
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
    Building2,
    ChevronLeft,
    ChevronRight,
    IdCard,
    Inbox,
    Mail,
    MapPin,
    Phone,
    Plus,
    Search,
    Users,
} from 'lucide-react';

const iniciales = (nombre = '') =>
    nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || '?';

const Th = ({ icon: Icon, children }) => (
    <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
        <span className="inline-flex items-center gap-2">
            <Icon className="size-4 text-border" />
            {children}
        </span>
    </TableHead>
);

const Dato = ({ icon: Icon, value }) =>
    value ? (
        <span className="inline-flex items-center gap-2 text-primary">
            <Icon className="size-4 text-border" />
            {value}
        </span>
    ) : (
        <span className="text-border">—</span>
    );

export default function Index({ auth, clientes }) {
    const [q, setQ] = useState('');

    const filtrados = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return clientes.data;
        return clientes.data.filter((c) =>
            [c.identificacion, c.razon_social, c.email, c.telefono, c.direccion]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(t))
        );
    }, [q, clientes.data]);

    const total = clientes.total ?? clientes.data.length;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                            <Users className="size-5" />
                        </span>
                        <h2 className="text-xl font-semibold leading-tight text-primary">Clientes</h2>
                    </div>
                    <Button asChild>
                        <Link href={route('clientes.create')}>
                            <Plus />
                            Nuevo cliente
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title="Clientes" />

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg sm:p-8">
                        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-border/25" />
                        <div className="absolute -bottom-16 right-16 size-40 rounded-full bg-secondary/10" />
                        <div className="relative flex flex-wrap items-center justify-between gap-6">
                            <div>
                                <p className="text-sm text-border">Directorio</p>
                                <h3 className="mt-1 text-2xl font-bold">Tus clientes, en un solo lugar</h3>
                                <p className="mt-1 text-sm text-primary-foreground/80">
                                    Consulta y administra a quienes facturas.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
                                <span className="grid size-11 place-items-center rounded-xl bg-border text-primary">
                                    <Building2 className="size-6" />
                                </span>
                                <div>
                                    <p className="text-3xl font-bold leading-none">{total}</p>
                                    <p className="mt-1 text-xs text-primary-foreground/80">clientes registrados</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                        <div className="border-b border-border/40 p-4">
                            <div className="relative max-w-md">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                <Input
                                    type="search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Buscar por nombre, identificación, email…"
                                    aria-label="Buscar clientes"
                                    className="bg-secondary/40 pl-9"
                                />
                            </div>
                        </div>

                        <Table>
                            <TableHeader className="bg-primary [&_tr]:border-0">
                                <TableRow className="border-0 hover:bg-primary">
                                    <Th icon={IdCard}>Tipo</Th>
                                    <Th icon={IdCard}>Identificación</Th>
                                    <Th icon={Building2}>Razón social</Th>
                                    <Th icon={MapPin}>Dirección</Th>
                                    <Th icon={Mail}>Email</Th>
                                    <Th icon={Phone}>Teléfono</Th>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filtrados.length === 0 && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={6} className="py-14 text-center">
                                            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
                                                <Inbox className="size-7" />
                                            </span>
                                            <p className="mt-4 font-semibold text-primary">
                                                {q ? 'Sin resultados' : 'Aún no hay clientes'}
                                            </p>
                                            <p className="mt-1 text-sm text-primary/70">
                                                {q
                                                    ? 'Prueba con otro término de búsqueda.'
                                                    : 'Registra el primero con «Nuevo cliente».'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {filtrados.map((cliente) => (
                                    <TableRow key={cliente.id} className="border-secondary">
                                        <TableCell className="px-5 py-3.5">
                                            <Badge
                                                variant="secondary"
                                                className="border-border bg-secondary text-primary"
                                            >
                                                {cliente.tipo_identificacion_rel?.descripcion ??
                                                    cliente.tipo_identificacion_codigo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 font-mono font-medium text-primary">
                                            {cliente.identificacion}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-9">
                                                    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                                                        {iniciales(cliente.razon_social)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-primary">
                                                    {cliente.razon_social}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <Dato icon={MapPin} value={cliente.direccion} />
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <Dato icon={Mail} value={cliente.email} />
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5">
                                            <Dato icon={Phone} value={cliente.telefono} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Paginación */}
                    {clientes.links.length > 3 && (
                        <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Paginación">
                            {clientes.links.map((link, i) => {
                                const esPrev = i === 0;
                                const esNext = i === clientes.links.length - 1;

                                const contenido = esPrev ? (
                                    <ChevronLeft />
                                ) : esNext ? (
                                    <ChevronRight />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                );

                                const label = esPrev ? 'Anterior' : esNext ? 'Siguiente' : `Página ${link.label}`;

                                return link.url ? (
                                    <Button
                                        key={i}
                                        asChild
                                        size="icon"
                                        variant={link.active ? 'default' : 'outline'}
                                        className={
                                            link.active
                                                ? ''
                                                : 'border-border bg-white text-primary hover:bg-secondary hover:text-primary'
                                        }
                                    >
                                        <Link href={link.url} preserveScroll aria-label={label}>
                                            {contenido}
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        key={i}
                                        size="icon"
                                        variant="outline"
                                        disabled
                                        aria-label={label}
                                        className="border-secondary bg-white/60 text-border"
                                    >
                                        {contenido}
                                    </Button>
                                );
                            })}
                        </nav>
                    )}
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}
