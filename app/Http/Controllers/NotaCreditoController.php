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
    public function create(Request $request): Response
    {
        $factura = Comprobante::with(['cliente', 'detalles'])
            ->findOrFail($request->query('factura'));

        abort_unless($factura->tipo_comprobante === '01', 404);

        return Inertia::render('NotasCredito/Create', [
            'factura' => $factura,
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
