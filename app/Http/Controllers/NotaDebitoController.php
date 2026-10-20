<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotaDebitoRequest;
use App\Models\Cliente;
use App\Models\Emisor;
use App\Models\ImpuestoTarifa;
use App\Services\NotaDebitoService;
use App\Models\Comprobante;
use Inertia\Inertia;

class NotaDebitoController extends Controller
{
    public function __construct(
        protected NotaDebitoService $notaDebitoService
    ) {}

   public function create(?Comprobante $factura = null)
    {
        $facturaData = null;

        if ($factura && $factura->exists) {
            $factura->load('cliente.tipoIdentificacion');
            $facturaData = [
                'id' => $factura->id,
                'establecimiento' => $factura->establecimiento,
                'punto_emision' => $factura->punto_emision,
                'secuencial' => $factura->secuencial,
                'importe_total' => $factura->importe_total ?? $factura->total,
                'cliente' => $factura->cliente,
            ];
        }

        // Consultar tarifas de IVA (codigo_impuesto = 2) activas en la BD
        $tarifasIva = ImpuestoTarifa::where('codigo_impuesto', '2')
            ->where('activo', true)
            ->get(['id', 'codigo_porcentaje', 'descripcion', 'porcentaje']);

        return Inertia::render('NotasDebito/Create', [
            'factura' => $facturaData,
            'tarifasIva' => $tarifasIva, 
        ]);
    }

    public function store(StoreNotaDebitoRequest $request)
    {
        $comprobante = $this->notaDebitoService->crear($request->validated());

        return redirect()->route('comprobantes.index')
            ->with('success', 'Nota de Débito generada exitosamente.');
    }
}
