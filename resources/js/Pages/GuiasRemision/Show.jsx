import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/FlashMessages';
import { Head, router } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
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
    CheckCircle2,
    Clock,
    FileText,
    Loader2,
    MapPin,
    Package,
    Send,
    Truck,
} from 'lucide-react';

export default function Show({ auth, guia }) {
    const [processing, setProcessing] = useState(false);
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

    const handleProcesarSri = () => {
        setProcessing(true);
        router.post(
            route('guias.procesarSri', guia.id),
            {},
            {
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <Truck className="size-5" />
                    </span>
                    <h2 className="text-xl font-semibold leading-tight text-primary">
                        Guía de Remisión N° {guia.establecimiento}-{guia.punto_emision}-{guia.secuencial}
                    </h2>
                </div>
            }
        >
            <Head title={`Guía ${guia.establecimiento}-${guia.punto_emision}-${guia.secuencial}`} />

            {/* Overlay Modal SRI */}
            {processing && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-center">
                            <Loader2 className="size-12 animate-spin text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">Transmitiendo al SRI</h3>
                        <p className="text-sm text-gray-600">
                            Generando XML, firmando y conectando con WebServices...
                        </p>
                        <div className="text-xs font-mono text-gray-400">
                            Tiempo transcurrido: {elapsedSeconds}s
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Barra Estado y Acción */}
                    <Card className="gap-0 border-border/60 py-0 shadow-sm">
                        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500">Estado SRI:</span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${
                                            guia.estado_sri === 'AUTORIZADO'
                                                ? 'bg-green-100 text-green-800'
                                                : guia.estado_sri === 'CREADO'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {guia.estado_sri === 'AUTORIZADO' && <CheckCircle2 className="size-3.5" />}
                                        {guia.estado_sri === 'CREADO' && <Clock className="size-3.5" />}
                                        {['DEVUELTA', 'RECHAZADO'].includes(guia.estado_sri) && <AlertTriangle className="size-3.5" />}
                                        {guia.estado_sri}
                                    </span>
                                </div>
                                <p className="font-mono text-xs text-gray-400">
                                    Clave de Acceso: {guia.clave_acceso || 'Pendiente de generación'}
                                </p>
                            </div>

                            {guia.estado_sri !== 'AUTORIZADO' && (
                                <Button onClick={handleProcesarSri} disabled={processing} size="lg">
                                    <Send />
                                    Enviar / Procesar SRI
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mensajes del SRI */}
                    {guia.mensajes_sri && (
                        <Card className="gap-0 border-border/60 bg-gray-900 py-0 shadow-sm">
                            <CardContent className="p-4 font-mono text-xs text-green-400">
                                <span className="block font-bold text-gray-400 mb-1 border-b border-gray-800 pb-1">
                                    Respuesta WebService SRI:
                                </span>
                                <pre className="whitespace-pre-wrap">{guia.mensajes_sri}</pre>
                            </CardContent>
                        </Card>
                    )}

                    {/* Ficha de Transporte y Destino */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Truck className="size-5 text-border" />
                                    Transportista
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-2 text-sm">
                                <div><span className="text-gray-500">Razón Social:</span> <strong className="text-primary">{guia.razon_social_transportista}</strong></div>
                                <div><span className="text-gray-500">Identificación:</span> <span className="font-mono">{guia.identificacion_transportista}</span></div>
                                <div><span className="text-gray-500">Placa Vehículo:</span> <span className="font-mono font-bold uppercase">{guia.placa}</span></div>
                                <div><span className="text-gray-500">Periodo Traslado:</span> {guia.fecha_inicio_transporte} al {guia.fecha_fin_transporte}</div>
                                <div><span className="text-gray-500">Punto Partida:</span> {guia.dir_partida}</div>
                            </CardContent>
                        </Card>

                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                            <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="size-5 text-border" />
                                    Destinatario y Sustento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-2 text-sm">
                                <div><span className="text-gray-500">Cliente Destino:</span> <strong className="text-primary">{guia.cliente?.razon_social}</strong></div>
                                <div><span className="text-gray-500">RUC/Cédula:</span> <span className="font-mono">{guia.cliente?.identificacion}</span></div>
                                <div><span className="text-gray-500">Dirección Entrega:</span> {guia.dir_destinatario}</div>
                                <div><span className="text-gray-500">Motivo Traslado:</span> {guia.motivo_traslado}</div>
                                <div><span className="text-gray-500">Doc. Sustento:</span> <span className="font-mono">{guia.num_doc_sustento || 'N/A'}</span></div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabla de Artículos */}
                    <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                        <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="size-5 text-border" />
                                Artículos Trasladados
                            </CardTitle>
                        </CardHeader>
                        <Table>
                            <TableHeader className="bg-primary/90 [&_tr]:border-0">
                                <TableRow className="border-0 hover:bg-transparent">
                                    <TableHead className="h-11 px-3 text-xs font-semibold uppercase text-primary-foreground w-44">Código</TableHead>
                                    <TableHead className="h-11 px-3 text-xs font-semibold uppercase text-primary-foreground">Descripción</TableHead>
                                    <TableHead className="h-11 px-3 text-xs font-semibold uppercase text-primary-foreground text-right w-36">Cantidad</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {guia.detalles?.map((det) => (
                                    <TableRow key={det.id} className="border-secondary">
                                        <TableCell className="p-3 font-mono text-sm">{det.codigo_interno}</TableCell>
                                        <TableCell className="p-3 text-sm">{det.descripcion}</TableCell>
                                        <TableCell className="p-3 text-sm text-right font-bold tabular-nums">{det.cantidad}</TableCell>
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