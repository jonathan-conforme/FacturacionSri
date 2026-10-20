<?php

namespace App\Http\Controllers;

use App\Http\Requests\Factura\StoreNotaCreditoRequest;
use App\Models\Comprobante;
use App\Services\NotaCreditoService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotaCreditoController extends Controller
{
    public function __construct(
        protected NotaCreditoService $notaCreditoService
    ) {}

    /**
     * Formulario para emitir una nota de crédito sobre una factura.
     * La factura llega por query string: /notas-credito/create?factura=ID
     */
    public function create(Request $request, $facturaId = null)
    {
        // 1. Obtener ID de la factura (funciona tanto con ?factura=31 como con /31)
        $id = $facturaId ?? $request->query('factura');

        if (! $id) {
            return redirect()->route('facturas.index')
                ->with('error', 'Debes seleccionar una factura válida para emitir una Nota de Crédito.');
        }

        // 2. Cargar la factura junto a sus detalles y cliente
        $comprobante = Comprobante::with(['cliente', 'detalles'])
            ->where('tipo_comprobante', '01')
            ->find($id);

        if (! $comprobante) {
            return redirect()->route('facturas.index')
                ->with('error', 'No se encontró la factura seleccionada.');
        }

        return Inertia::render('NotasCredito/Create', [
            'factura' => $comprobante,
        ]);
    }

    public function store(StoreNotaCreditoRequest $request)
    {
        $nc = $this->notaCreditoService->crearYProcesar($request->validated());

        if ($nc->estado_sri === 'AUTORIZADO') {
            return redirect()->back()->with('success', 'Nota de crédito autorizada por el SRI.');
        }

        return redirect()->back()->with(
            'error',
            "La nota de crédito quedó en estado {$nc->estado_sri}. Revisa el detalle en comprobantes emitidos."
        );
    }
}
