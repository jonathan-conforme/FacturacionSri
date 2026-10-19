import { useForm } from '@inertiajs/react';
import FlashMessages from '@/Components/FlashMessages';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';

import {
    BadgeCheck,
    BookOpen,
    Building2,
    CheckCircle2,
    ChevronDown,
    FileKey,
    FlaskConical,
    Hash,
    IdCard,
    KeyRound,
    Loader2,
    MapPin,
    Receipt,
    Save,
    Settings2,
    ShieldCheck,
    Store,
    Warehouse,
    Cpu,
    Landmark,
} from 'lucide-react';

/* ---------- Solo presentación ---------- */
const Seccion = ({ icon: Icon, title, description, children }) => (
    <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm">
        <CardHeader className="gap-1 bg-primary px-6 py-4 text-primary-foreground">
            <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="size-5 text-border" />
                {title}
            </CardTitle>
            {description && (
                <CardDescription className="text-primary-foreground/80">{description}</CardDescription>
            )}
        </CardHeader>
        <CardContent className="p-6">{children}</CardContent>
    </Card>
);

const Campo = ({ label, icon: Icon, error, className = '', children }) => (
    <div className={`space-y-2 ${className}`}>
        <Label className="text-primary">{label}</Label>
        <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-border" />
            {children}
        </div>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
);

const selectClass =
    'h-9 w-full appearance-none rounded-md border border-input bg-white pl-9 pr-9 text-sm text-primary shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

const inputClass = 'pl-9 text-primary';

export default function Index({ emisor }) {
    // Definimos el formulario con los datos iniciales si ya existe un Emisor
    const { data, setData, post, put, processing, errors } = useForm({
        _method: emisor ? 'PUT' : 'POST', // Permite el envío de archivos con método PUT en Laravel
        ruc: emisor?.ruc || '',
        razon_social: emisor?.razon_social || '',
        nombre_comercial: emisor?.nombre_comercial || '',
        dir_matriz: emisor?.dir_matriz || '',
        dir_establecimiento: emisor?.dir_establecimiento || '',
        codigo_establecimiento: emisor?.codigo_establecimiento || '001',
        punto_emision: emisor?.punto_emision || '001',
        ambiente: emisor?.ambiente || '1', // 1: Pruebas, 2: Producción
        contribuyente_especial: emisor?.contribuyente_especial || '',
        obligado_contabilidad: emisor?.obligado_contabilidad || 'NO',
        p12_file: null,
        p12_password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (emisor) {
            // Nota: Para subir archivos en actualizaciones (PUT), usaremos POST apuntando a la ruta update con _method: 'PUT'
            post(route('emisor.update', emisor.id), {
                forceFormData: true,
            });
        } else {
            post(route('emisor.store'), {
                forceFormData: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <Landmark className="size-5" />
                    </span>
                    <h2 className="text-xl font-semibold leading-tight text-primary">Configuración del Emisor (SRI)</h2>
                </div>
            }
        >
            <Head title="Configuración de Emisor" />

            <div className="min-h-screen bg-secondary/40 py-10">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* SECCIÓN 1: DATOS DE LA EMPRESA */}
                        <Seccion
                            icon={Building2}
                            title="Información General"
                            description="Datos legales de tu empresa registrados en el SRI."
                        >
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <Campo label="RUC *" icon={IdCard} error={errors.ruc}>
                                    <Input
                                        type="text"
                                        value={data.ruc}
                                        maxLength={13}
                                        onChange={(e) => setData('ruc', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </Campo>

                                <Campo label="Razón Social *" icon={Building2} error={errors.razon_social}>
                                    <Input
                                        type="text"
                                        value={data.razon_social}
                                        onChange={(e) => setData('razon_social', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </Campo>

                                <Campo label="Nombre Comercial" icon={Store} error={errors.nombre_comercial}>
                                    <Input
                                        type="text"
                                        value={data.nombre_comercial}
                                        onChange={(e) => setData('nombre_comercial', e.target.value)}
                                        className={inputClass}
                                    />
                                </Campo>

                                <Campo
                                    label="Obligado a Llevar Contabilidad *"
                                    icon={BookOpen}
                                    error={errors.obligado_contabilidad}
                                >
                                    <select
                                        value={data.obligado_contabilidad}
                                        onChange={(e) => setData('obligado_contabilidad', e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="SI">SI</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                </Campo>

                                <Campo
                                    label="Dirección Matriz *"
                                    icon={MapPin}
                                    error={errors.dir_matriz}
                                    className="md:col-span-2"
                                >
                                    <Input
                                        type="text"
                                        value={data.dir_matriz}
                                        onChange={(e) => setData('dir_matriz', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </Campo>

                                <Campo
                                    label="Dirección Establecimiento"
                                    icon={Warehouse}
                                    error={errors.dir_establecimiento}
                                    className="md:col-span-2"
                                >
                                    <Input
                                        type="text"
                                        value={data.dir_establecimiento}
                                        onChange={(e) => setData('dir_establecimiento', e.target.value)}
                                        className={inputClass}
                                    />
                                </Campo>
                            </div>
                        </Seccion>

                        {/* SECCIÓN 2: PARÁMETROS DEL SRI */}
                        <Seccion
                            icon={Settings2}
                            title="Parámetros de Facturación Electrónica"
                            description="Códigos y ambiente con los que se emitirán tus comprobantes."
                        >
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                                <Campo
                                    label="Cód. Establecimiento *"
                                    icon={Hash}
                                    error={errors.codigo_establecimiento}
                                >
                                    <Input
                                        type="text"
                                        maxLength={3}
                                        value={data.codigo_establecimiento}
                                        onChange={(e) => setData('codigo_establecimiento', e.target.value)}
                                        className={`${inputClass} font-mono`}
                                        required
                                    />
                                </Campo>

                                <Campo label="Punto de Emisión *" icon={Cpu} error={errors.punto_emision}>
                                    <Input
                                        type="text"
                                        maxLength={3}
                                        value={data.punto_emision}
                                        onChange={(e) => setData('punto_emision', e.target.value)}
                                        className={`${inputClass} font-mono`}
                                        required
                                    />
                                </Campo>

                                <Campo label="Ambiente SRI *" icon={FlaskConical} error={errors.ambiente}>
                                    <select
                                        value={data.ambiente}
                                        onChange={(e) => setData('ambiente', e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="1">1 - Pruebas</option>
                                        <option value="2">2 - Producción</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-border" />
                                </Campo>

                                <Campo
                                    label="Nro. Contribuyente Especial"
                                    icon={BadgeCheck}
                                    error={errors.contribuyente_especial}
                                >
                                    <Input
                                        type="text"
                                        value={data.contribuyente_especial}
                                        onChange={(e) => setData('contribuyente_especial', e.target.value)}
                                        className={inputClass}
                                        placeholder="Opcional"
                                    />
                                </Campo>
                            </div>
                        </Seccion>

                        {/* SECCIÓN 3: FIRMA ELECTRÓNICA */}
                        <Seccion
                            icon={ShieldCheck}
                            title="Firma Electrónica (.p12 / .pfx)"
                            description="Certificado digital con el que se firman tus comprobantes."
                        >
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-primary">Archivo de la Firma</Label>
                                    <div className="relative">
                                        <FileKey className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-border" />
                                        <input
                                            type="file"
                                            accept=".p12,.pfx"
                                            onChange={(e) => setData('p12_file', e.target.files[0])}
                                            className="block h-9 w-full cursor-pointer rounded-md border border-dashed border-border bg-secondary/40 pl-9 pr-2 text-sm text-primary outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50 file:mr-3 file:h-full file:cursor-pointer file:border-0 file:bg-transparent file:px-0 file:text-sm file:font-semibold file:text-primary hover:bg-secondary"
                                        />
                                    </div>
                                    {emisor?.p12_path && (
                                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                                            <CheckCircle2 className="size-4 text-border" />
                                            Certificado cargado actualmente en el servidor.
                                        </p>
                                    )}
                                    {errors.p12_file && <p className="mt-1 text-sm text-destructive">{errors.p12_file}</p>}
                                </div>

                                <Campo label="Contraseña de la Firma" icon={KeyRound} error={errors.p12_password}>
                                    <Input
                                        type="password"
                                        value={data.p12_password}
                                        onChange={(e) => setData('p12_password', e.target.value)}
                                        className={inputClass}
                                        placeholder={emisor?.p12_password ? '•••••••• (Dejar en blanco para conservar)' : 'Contraseña de la firma'}
                                    />
                                </Campo>
                            </div>
                        </Seccion>

                        {/* BOTÓN GUARDAR */}
                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-border/60">
                            <p className="hidden items-center gap-2 text-sm text-primary/70 sm:flex">
                                <Receipt className="size-4 text-border" />
                                Los campos con * son obligatorios.
                            </p>
                            <Button type="submit" disabled={processing} size="lg" className="ml-auto">
                                {processing ? <Loader2 className="animate-spin" /> : <Save />}
                                {processing ? 'Guardando...' : 'Guardar Configuración'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <FlashMessages />
        </AuthenticatedLayout>
    );
}
