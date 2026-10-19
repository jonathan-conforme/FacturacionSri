import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';

import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';

import {
    BarChart3,
    CalendarDays,
    CircleDollarSign,
    Clock,
    FileText,
    LayoutDashboard,
    LineChart,
    Percent,
    PieChart,
    ShieldCheck,
    Target,
    TrendingDown,
    TrendingUp,
    Trophy,
    Users,
} from 'lucide-react';

ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
);

/* ---------- Paleta ---------- */
const C = {
    dark: '#235347',
    mid: '#8EB69B',
    light: '#DAF1DE',
    darkA: (a) => `rgba(35, 83, 71, ${a})`,
    midA: (a) => `rgba(142, 182, 155, ${a})`,
};

ChartJS.defaults.font.family = 'inherit';
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = C.dark;
ChartJS.defaults.plugins.tooltip.backgroundColor = C.dark;
ChartJS.defaults.plugins.tooltip.titleColor = C.light;
ChartJS.defaults.plugins.tooltip.bodyColor = C.light;
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 10;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;

/* =====================================================================
 * DATOS FICTICIOS
 * Reemplázalos enviando un prop `stats` desde el controlador con esta
 * misma estructura (por ejemplo: Inertia::render('Dashboard', ['stats' => ...])).
 * ===================================================================== */
const DATOS_FICTICIOS = {
    kpis: {
        ventas: { valor: 18450.75, cambio: 12.4 },
        facturas: { valor: 142, cambio: 8.1 },
        clientes: { valor: 37, cambio: 4.5 },
        iva: { valor: 2767.61, cambio: -2.3 },
    },
    meta: { actual: 18450.75, objetivo: 25000 },
    tasaAutorizacion: 94.6,

    // Datos que cambian según el período seleccionado
    periodos: {
        semana: {
            label: '7 días',
            etiquetas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            ventas: [820, 1340, 980, 1560, 1890, 1230, 640],
            iva: [123, 201, 147, 234, 283, 185, 96],
        },
        mes: {
            label: '4 semanas',
            etiquetas: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            ventas: [3920, 4780, 4310, 5440],
            iva: [588, 717, 647, 816],
        },
        anio: {
            label: '12 meses',
            etiquetas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            ventas: [9800, 11200, 10450, 13900, 12750, 15300, 14100, 16800, 15900, 18450, 17200, 21500],
            iva: [1470, 1680, 1568, 2085, 1913, 2295, 2115, 2520, 2385, 2768, 2580, 3225],
        },
    },

    estados: {
        etiquetas: ['Autorizado', 'Recibida', 'Creado', 'Devuelta'],
        valores: [118, 14, 6, 4],
    },

    topClientes: {
        etiquetas: ['Comercial Andes S.A.', 'María Fernanda Ruiz', 'Distribuidora Litoral', 'Tecnoservicios Cía.', 'Juan Pérez'],
        valores: [4820, 3640, 2975, 2310, 1480],
    },

    diasSemana: {
        etiquetas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        valores: [24, 31, 22, 28, 35, 18, 9],
    },

    impuestos: {
        etiquetas: ['IVA 15%', 'IVA 0%', 'No objeto'],
        valores: [72, 21, 7],
    },

    recientes: [
        { id: 1, numero: '001-001-000000142', cliente: 'Comercial Andes S.A.', total: 1250.0, estado: 'AUTORIZADO' },
        { id: 2, numero: '001-001-000000141', cliente: 'María Fernanda Ruiz', total: 340.5, estado: 'AUTORIZADO' },
        { id: 3, numero: '001-001-000000140', cliente: 'Distribuidora Litoral', total: 875.25, estado: 'RECIBIDA' },
        { id: 4, numero: '001-001-000000139', cliente: 'Juan Pérez', total: 96.8, estado: 'DEVUELTA' },
        { id: 5, numero: '001-001-000000138', cliente: 'Tecnoservicios Cía.', total: 620.0, estado: 'CREADO' },
    ],
};

/* ---------- Utilidades ---------- */
const dinero = (n) =>
    `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const degradado = (context) => {
    const { chart } = context;
    const { ctx, chartArea } = chart;
    if (!chartArea) return C.midA(0.3);
    const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, C.darkA(0.4));
    g.addColorStop(1, C.midA(0.02));
    return g;
};

const ejes = (formatoY) => ({
    x: { grid: { display: false }, border: { display: false } },
    y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: C.midA(0.25) },
        ticks: { callback: formatoY },
    },
});

const tooltipDinero = {
    callbacks: { label: (ctx) => ` ${ctx.dataset.label ?? ''}: ${dinero(ctx.parsed.y ?? ctx.parsed.x)}` },
};

const estiloEstado = {
    AUTORIZADO: 'border-primary bg-primary text-primary-foreground',
    RECIBIDA: 'border-border bg-border/30 text-primary',
    CREADO: 'border-border bg-secondary text-primary',
    DEVUELTA: 'border-destructive/40 bg-destructive/10 text-destructive',
};

/* ---------- Componentes de presentación ---------- */
const Kpi = ({ icon: Icon, titulo, valor, cambio, sufijo = 'vs. mes anterior' }) => {
    const sube = cambio >= 0;
    return (
        <Card className="gap-0 border-border/60 py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-primary/70">{titulo}</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-primary">{valor}</p>
                    </div>
                    <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                        <Icon className="size-5" />
                    </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs">
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                            sube ? 'bg-primary text-primary-foreground' : 'bg-destructive/10 text-destructive'
                        }`}
                    >
                        {sube ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                        {Math.abs(cambio)}%
                    </span>
                    <span className="text-primary/60">{sufijo}</span>
                </div>
            </CardContent>
        </Card>
    );
};

const Grafica = ({ icon: Icon, titulo, descripcion, className = '', alto = 'h-72', accion, children }) => (
    <Card className={`gap-0 overflow-hidden border-border/60 py-0 shadow-sm ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-secondary px-5 py-4">
            <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
                    <Icon className="size-4" />
                </span>
                <div>
                    <CardTitle className="text-base text-primary">{titulo}</CardTitle>
                    {descripcion && <CardDescription className="text-primary/60">{descripcion}</CardDescription>}
                </div>
            </div>
            {accion}
        </CardHeader>
        <CardContent className={`p-5 ${alto}`}>{children}</CardContent>
    </Card>
);

export default function Dashboard({ stats = DATOS_FICTICIOS }) {
    const [periodo, setPeriodo] = useState('anio');
    const p = stats.periodos[periodo];

    const totalPeriodo = p.ventas.reduce((a, b) => a + b, 0);
    const porcentajeMeta = Math.min(100, Math.round((stats.meta.actual / stats.meta.objetivo) * 100));

    /* ---- Configuración de cada gráfica ---- */
    const dataVentas = {
        labels: p.etiquetas,
        datasets: [
            {
                label: 'Ventas',
                data: p.ventas,
                borderColor: C.dark,
                backgroundColor: degradado,
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: C.light,
                pointBorderColor: C.dark,
                pointBorderWidth: 2,
            },
        ],
    };

    const dataIngresosIva = {
        labels: p.etiquetas,
        datasets: [
            { label: 'Subtotal', data: p.ventas.map((v, i) => v - p.iva[i]), backgroundColor: C.dark, borderRadius: 6 },
            { label: 'IVA', data: p.iva, backgroundColor: C.mid, borderRadius: 6 },
        ],
    };

    const dataEstados = {
        labels: stats.estados.etiquetas,
        datasets: [
            {
                data: stats.estados.valores,
                backgroundColor: [C.dark, C.mid, C.light, C.darkA(0.45)],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 8,
            },
        ],
    };

    const dataTopClientes = {
        labels: stats.topClientes.etiquetas,
        datasets: [
            {
                label: 'Facturado',
                data: stats.topClientes.valores,
                backgroundColor: [C.dark, C.darkA(0.85), C.darkA(0.7), C.mid, C.midA(0.7)],
                borderRadius: 8,
                barThickness: 22,
            },
        ],
    };

    const dataDias = {
        labels: stats.diasSemana.etiquetas,
        datasets: [
            {
                label: 'Facturas',
                data: stats.diasSemana.valores,
                backgroundColor: (ctx) => {
                    const max = Math.max(...stats.diasSemana.valores);
                    return ctx.raw === max ? C.dark : C.mid;
                },
                borderRadius: 8,
            },
        ],
    };

    const dataImpuestos = {
        labels: stats.impuestos.etiquetas,
        datasets: [
            {
                data: stats.impuestos.valores,
                backgroundColor: [C.dark, C.mid, C.light],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 8,
            },
        ],
    };

    const opcionesBase = { responsive: true, maintainAspectRatio: false };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                        <LayoutDashboard className="size-5" />
                    </span>
                    <h2 className="text-xl font-semibold leading-tight text-primary">Dashboard</h2>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Banner + selector de período */}
                    <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg sm:p-8">
                        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-border/25" />
                        <div className="absolute -bottom-16 right-24 size-40 rounded-full bg-secondary/10" />
                        <div className="relative flex flex-wrap items-center justify-between gap-6">
                            <div>
                                <p className="text-sm text-border">Resumen de facturación</p>
                                <h3 className="mt-1 text-2xl font-bold">Así va tu negocio</h3>
                                <p className="mt-1 text-sm text-primary-foreground/80">
                                    Ventas de los últimos {p.label}: <strong>{dinero(totalPeriodo)}</strong>
                                </p>
                            </div>

                            <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 backdrop-blur">
                                <CalendarDays className="ms-2 me-1 size-4 text-border" />
                                {Object.entries(stats.periodos).map(([clave, v]) => (
                                    <Button
                                        key={clave}
                                        type="button"
                                        size="sm"
                                        onClick={() => setPeriodo(clave)}
                                        className={
                                            periodo === clave
                                                ? 'bg-secondary text-primary hover:bg-secondary'
                                                : 'bg-transparent text-primary-foreground hover:bg-white/10'
                                        }
                                    >
                                        {v.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Kpi
                            icon={CircleDollarSign}
                            titulo="Ventas del mes"
                            valor={dinero(stats.kpis.ventas.valor)}
                            cambio={stats.kpis.ventas.cambio}
                        />
                        <Kpi
                            icon={FileText}
                            titulo="Facturas emitidas"
                            valor={stats.kpis.facturas.valor}
                            cambio={stats.kpis.facturas.cambio}
                        />
                        <Kpi
                            icon={Users}
                            titulo="Clientes activos"
                            valor={stats.kpis.clientes.valor}
                            cambio={stats.kpis.clientes.cambio}
                        />
                        <Kpi
                            icon={Percent}
                            titulo="IVA recaudado"
                            valor={dinero(stats.kpis.iva.valor)}
                            cambio={stats.kpis.iva.cambio}
                        />
                    </div>

                    {/* Gráficas: fila 1 */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <Grafica
                            icon={LineChart}
                            titulo="Evolución de ventas"
                            descripcion={`Últimos ${p.label}`}
                            className="lg:col-span-2"
                        >
                            <Line
                                data={dataVentas}
                                options={{
                                    ...opcionesBase,
                                    interaction: { mode: 'index', intersect: false },
                                    plugins: { legend: { display: false }, tooltip: tooltipDinero },
                                    scales: ejes((v) => `$${Number(v).toLocaleString('en-US')}`),
                                }}
                            />
                        </Grafica>

                        <Grafica icon={ShieldCheck} titulo="Estado en el SRI" descripcion="Comprobantes por estado">
                            <Doughnut
                                data={dataEstados}
                                options={{
                                    ...opcionesBase,
                                    cutout: '65%',
                                    plugins: { legend: { position: 'bottom' } },
                                }}
                            />
                        </Grafica>
                    </div>

                    {/* Gráficas: fila 2 */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <Grafica
                            icon={BarChart3}
                            titulo="Subtotal vs. IVA"
                            descripcion={`Últimos ${p.label}`}
                            className="lg:col-span-2"
                        >
                            <Bar
                                data={dataIngresosIva}
                                options={{
                                    ...opcionesBase,
                                    plugins: {
                                        legend: { position: 'bottom' },
                                        tooltip: tooltipDinero,
                                    },
                                    scales: {
                                        ...ejes((v) => `$${Number(v).toLocaleString('en-US')}`),
                                        x: { stacked: true, grid: { display: false }, border: { display: false } },
                                        y: {
                                            stacked: true,
                                            beginAtZero: true,
                                            border: { display: false },
                                            grid: { color: C.midA(0.25) },
                                            ticks: { callback: (v) => `$${Number(v).toLocaleString('en-US')}` },
                                        },
                                    },
                                }}
                            />
                        </Grafica>

                        <Grafica icon={PieChart} titulo="Distribución de impuestos" descripcion="% sobre ventas">
                            <Pie
                                data={dataImpuestos}
                                options={{
                                    ...opcionesBase,
                                    plugins: {
                                        legend: { position: 'bottom' },
                                        tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%` } },
                                    },
                                }}
                            />
                        </Grafica>
                    </div>

                    {/* Gráficas: fila 3 */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Grafica icon={Trophy} titulo="Top 5 clientes" descripcion="Por monto facturado">
                            <Bar
                                data={dataTopClientes}
                                options={{
                                    ...opcionesBase,
                                    indexAxis: 'y',
                                    plugins: { legend: { display: false }, tooltip: tooltipDinero },
                                    scales: {
                                        x: {
                                            beginAtZero: true,
                                            border: { display: false },
                                            grid: { color: C.midA(0.25) },
                                            ticks: { callback: (v) => `$${Number(v).toLocaleString('en-US')}` },
                                        },
                                        y: { grid: { display: false }, border: { display: false } },
                                    },
                                }}
                            />
                        </Grafica>

                        <Grafica icon={CalendarDays} titulo="Facturas por día de la semana" descripcion="El día más fuerte va resaltado">
                            <Bar
                                data={dataDias}
                                options={{
                                    ...opcionesBase,
                                    plugins: { legend: { display: false } },
                                    scales: ejes((v) => v),
                                }}
                            />
                        </Grafica>
                    </div>

                    {/* Otras estadísticas */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Meta + tasa */}
                        <Card className="gap-0 border-border/60 py-0 shadow-sm">
                            <CardHeader className="flex flex-row items-center gap-3 border-b border-secondary px-5 py-4">
                                <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
                                    <Target className="size-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-base text-primary">Metas del mes</CardTitle>
                                    <CardDescription className="text-primary/60">Progreso actual</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 p-5">
                                <div>
                                    <div className="mb-2 flex items-end justify-between">
                                        <span className="text-sm font-medium text-primary">Meta de ventas</span>
                                        <span className="text-sm font-bold text-primary">{porcentajeMeta}%</span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all duration-700"
                                            style={{ width: `${porcentajeMeta}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-primary/60">
                                        {dinero(stats.meta.actual)} de {dinero(stats.meta.objetivo)}
                                    </p>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-end justify-between">
                                        <span className="text-sm font-medium text-primary">Tasa de autorización</span>
                                        <span className="text-sm font-bold text-primary">{stats.tasaAutorizacion}%</span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className="h-full rounded-full bg-border transition-all duration-700"
                                            style={{ width: `${stats.tasaAutorizacion}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-primary/60">Comprobantes autorizados por el SRI</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Últimos comprobantes */}
                        <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm lg:col-span-2">
                            <CardHeader className="flex flex-row items-center gap-3 border-b border-secondary px-5 py-4">
                                <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
                                    <Clock className="size-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-base text-primary">Últimos comprobantes</CardTitle>
                                    <CardDescription className="text-primary/60">Actividad reciente</CardDescription>
                                </div>
                            </CardHeader>
                            <ul className="divide-y divide-secondary">
                                {stats.recientes.map((r) => (
                                    <li key={r.id} className="flex items-center gap-4 px-5 py-3 transition hover:bg-secondary/50">
                                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                            {r.cliente
                                                .split(' ')
                                                .slice(0, 2)
                                                .map((x) => x[0])
                                                .join('')
                                                .toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-primary">{r.cliente}</p>
                                            <p className="font-mono text-xs text-primary/60">{r.numero}</p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${estiloEstado[r.estado]}`}
                                        >
                                            {r.estado}
                                        </Badge>
                                        <span className="w-24 text-right text-sm font-bold tabular-nums text-primary">
                                            {dinero(r.total)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
