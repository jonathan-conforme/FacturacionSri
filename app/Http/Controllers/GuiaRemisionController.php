<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGuiaRemisionRequest;
use App\Models\Cliente;
use App\Models\Comprobante;
use App\Models\Emisor;
use App\Models\GuiaRemision;
use App\Services\GuiaRemisionService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GuiaRemisionController extends Controller
{
    public function __construct(
        protected GuiaRemisionService $guiaService
    ) {}

    public function index(): Response
    {
        $guias = GuiaRemision::with(['cliente', 'emisor'])
            ->latest()
            ->paginate(15);

        return Inertia::render('GuiasRemision/Index', [
            'guias' => $guias,
        ]);
    }

    public function create(): Response
{
    $emisor = Emisor::first();
    $siguienteSecuencial = '000000001';

    if ($emisor) {
        $ultimo = GuiaRemision::where('emisor_id', $emisor->id)
            ->where('establecimiento', $emisor->codigo_establecimiento ?? '001')
            ->where('punto_emision', $emisor->punto_emision ?? '001')
            ->max('secuencial');

        $siguienteSecuencial = str_pad(((int) $ultimo) + 1, 9, '0', STR_PAD_LEFT);
    }

    return Inertia::render('GuiasRemision/Create', [
        'emisores' => Emisor::select('id', 'razon_social', 'ruc', 'codigo_establecimiento', 'punto_emision', 'dir_matriz')->get(),
        'clientes' => Cliente::select('id', 'razon_social', 'identificacion', 'direccion')->get(),
        'siguienteSecuencial' => $siguienteSecuencial,
        'comprobantes' => Comprobante::where('tipo_comprobante', '01')
            ->where('estado_sri', 'AUTORIZADO')
            ->select('id', 'establecimiento', 'punto_emision', 'secuencial', 'clave_acceso', 'fecha_emision', 'cliente_id')
            ->latest()
            ->take(50)
            ->get(),
    ]);
}

    public function store(StoreGuiaRemisionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $guia = $this->guiaService->crearGuia($data);

        return redirect()->route('guias.show', $guia->id)
            ->with('success', 'Guía de remisión registrada correctamente.');
    }

    public function show(GuiaRemision $guia): Response
    {
        $guia->load(['emisor', 'cliente', 'comprobante', 'detalles']);

        return Inertia::render('GuiasRemision/Show', [
            'guia' => $guia,
        ]);
    }

    public function procesarSri(GuiaRemision $guia): RedirectResponse
    {
        try {
            $resultado = $this->guiaService->procesarSri($guia);

            if ($resultado['exito']) {
                return back()->with('success', 'Guía de Remisión Autorizada con Éxito por el SRI.');
            }

            return back()->with('error', 'El SRI devolvió o rechazó la Guía de Remisión. Revisa el historial de mensajes.');

        } catch (\Throwable $e) {
            return back()->with('error', "Error en el procesamiento SRI: {$e->getMessage()}");
        }
    }
}