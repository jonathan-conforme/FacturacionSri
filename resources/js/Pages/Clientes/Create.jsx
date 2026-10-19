import React from 'react';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';

import {
    Building2,
    ChevronDown,
    IdCard,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    UserPlus,
    UserRound,
} from 'lucide-react';

/* Solo presentación: etiqueta + icono + contenido */
const Campo = ({ label, icon: Icon, children, error }) => (
    <div className="space-y-2">
        <Label className="text-primary">{label}</Label>
        <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
            {children}
        </div>
        {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
);

export default function Create({ auth, tiposIdentificacion }) {
    const { data, setData, post, processing, errors } = useForm({
        tipo_identificacion_codigo: '05', // Cédula por defecto
        identificacion: '',
        razon_social: '',
        direccion: '',
        email: '',
        telefono: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('clientes.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <UserPlus className="size-5" />
                    </span>
                    <h2 className="text-xl font-semibold leading-tight text-primary">Registrar Nuevo Cliente</h2>
                </div>
            }
        >
            <Head title="Nuevo Cliente" />

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
                        <CardHeader className="gap-1 bg-primary px-6 py-5 text-primary-foreground">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="size-5 text-border" />
                                Datos del cliente
                            </CardTitle>
                            <CardDescription className="text-primary-foreground/80">
                                Completa la información para registrar al cliente en tu facturación.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <Campo label="Tipo Identificación" icon={IdCard}>
                                        <select
                                            className="h-9 w-full appearance-none rounded-md border border-input bg-white pl-9 pr-9 text-sm text-primary shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            value={data.tipo_identificacion_codigo}
                                            onChange={(e) => setData('tipo_identificacion_codigo', e.target.value)}
                                            required
                                        >
                                            {tiposIdentificacion.map((tipo) => (
                                                <option key={tipo.codigo} value={tipo.codigo}>
                                                    {tipo.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                    </Campo>

                                    <Campo
                                        label="Identificación / RUC / Cédula"
                                        icon={IdCard}
                                        error={errors.identificacion}
                                    >
                                        <Input
                                            type="text"
                                            className="pl-9 text-primary"
                                            value={data.identificacion}
                                            onChange={(e) => setData('identificacion', e.target.value)}
                                            required
                                        />
                                    </Campo>
                                </div>

                                <Campo label="Razón Social / Nombre Completo" icon={UserRound}>
                                    <Input
                                        type="text"
                                        className="pl-9 text-primary"
                                        value={data.razon_social}
                                        onChange={(e) => setData('razon_social', e.target.value)}
                                        required
                                    />
                                </Campo>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    <Campo label="Dirección" icon={MapPin}>
                                        <Input
                                            type="text"
                                            className="pl-9 text-primary"
                                            value={data.direccion}
                                            onChange={(e) => setData('direccion', e.target.value)}
                                        />
                                    </Campo>

                                    <Campo label="Email" icon={Mail}>
                                        <Input
                                            type="email"
                                            className="pl-9 text-primary"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                    </Campo>

                                    <Campo label="Teléfono" icon={Phone}>
                                        <Input
                                            type="text"
                                            className="pl-9 text-primary"
                                            value={data.telefono}
                                            onChange={(e) => setData('telefono', e.target.value)}
                                        />
                                    </Campo>
                                </div>

                                <div className="flex justify-end border-t border-secondary pt-5">
                                    <Button type="submit" disabled={processing} size="lg">
                                        {processing ? <Loader2 className="animate-spin" /> : <Save />}
                                        Guardar Cliente
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}
