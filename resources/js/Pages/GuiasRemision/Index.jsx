import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/FlashMessages';
import { Head, Link, router } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
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
    CalendarDays,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    Inbox,
    Plus,
    Send,
    Truck,
    UserRound,
} from 'lucide-react';

const Th = ({ icon: Icon, children, center = false }) => (
    <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
        <span className={`inline-flex items-center gap-2 ${center ? 'w-full justify-center' : ''}`}>
            <Icon className="size-4 text-border" />
            {children}
        </span>
    </TableHead>
);

export default function Index({ auth, guias }) {
    const [loadingId, setLoadingId] = useState(null);

    const handleEnviarSri = (id) => {
        setLoadingId(id);
        router.post(
            route('guias.procesarSri', id),
            {},
            {
                onFinish: () => setLoadingId(null),
            }
        );
    };

    const getEstadoBadge = (estadoSri) => {
        const styles = {
            AUTORIZADO: 'border-primary bg-primary text-primary-foreground',
            DEVUELTA: 'border-destructive/40 bg-destructive/10 text-destructive',
            CREADO: 'border-border bg-secondary text-primary',
            RECHAZADO: 'border-destructive/40 bg-destructive/10 text-destructive',
        };
        return (
            <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[estadoSri] || styles.CREADO}`}>
                {estadoSri || 'CREADO'}
            </Badge>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                            <Truck className="size-5" />
                        </span>
                        <h2 className="text-xl font-semibold text-primary">Guías de Remisión</h2>
                    </div>
                    <Button asChild>
                        <Link href={route('guias.create')}>
                            <Plus className="size-4" />
                            Nueva Guía
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title="Guías de Remisión" />

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                        <Table>
                            <TableHeader className="bg-primary [&_tr]:border-0">
                                <TableRow className="border-0 hover:bg-primary">
                                    <Th icon={FileText}>Secuencial</Th>
                                    <Th icon={Truck}>Transportista / Placa</Th>
                                    <Th icon={UserRound}>Destinatario</Th>
                                    <Th icon={CalendarDays}>Fecha Traslado</Th>
                                    <Th icon={CheckCircle2}>Estado SRI</Th>
                                    <Th icon={Clock} center>Acciones</Th>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {guias.data.length === 0 && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={6} className="py-14 text-center">
                                            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
                                                <Inbox className="size-7" />
                                            </span>
                                            <p className="mt-4 font-semibold text-primary">No hay guías de remisión registradas</p>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {guias.data.map((g) => (
                                    <TableRow key={g.id} className="border-secondary">
                                        <TableCell className="px-4 py-3 font-mono font-medium text-primary">
                                            {g.establecimiento}-{g.punto_emision}-{g.secuencial}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-primary">
                                            <div>{g.razon_social_transportista}</div>
                                            <span className="font-mono text-xs font-bold text-muted-foreground">
                                                PLACA: {g.placa}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-primary">
                                            {g.cliente?.razon_social || 'N/A'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-xs text-primary">
                                            {g.fecha_inicio_transporte} ➔ {g.fecha_fin_transporte}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            {getEstadoBadge(g.estado_sri)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button asChild variant="secondary" size="sm" className="border border-border text-primary hover:bg-border/40">
                                                    <Link href={route('guias.show', g.id)}>
                                                        <Eye className="size-3.5" />
                                                        Ver
                                                    </Link>
                                                </Button>

                                                {g.estado_sri !== 'AUTORIZADO' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleEnviarSri(g.id)}
                                                        disabled={loadingId === g.id}
                                                    >
                                                        <Send className="size-3.5" />
                                                        {loadingId === g.id ? 'Enviando...' : 'Enviar SRI'}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}