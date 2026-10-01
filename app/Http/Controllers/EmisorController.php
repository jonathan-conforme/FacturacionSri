<?php

namespace App\Http\Controllers;

use App\Http\Requests\Factura\StoreEmisorRequest;
use App\Http\Requests\Factura\UpdateEmisorRequest;
use App\Models\Emisor;
use App\Services\EmisorService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class EmisorController extends Controller
{

    public function __construct(
        protected EmisorService $emisorService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $emisor = $this->emisorService->obtenerEmisor();

        return Inertia::render('Emisor/Index', [
            'emisor' => $emisor
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmisorRequest $request): RedirectResponse
    {
        $this->emisorService->guardarOActualizar($request->validated());

        return redirect()->back()->with('success', 'Configuración del Emisor guardada correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Emisor $emisor)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Emisor $emisor)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmisorRequest $request, Emisor $emisor): RedirectResponse
    {
        $this->emisorService->guardarOActualizar($request->validated(), $emisor);

        return redirect()->back()->with('success', 'Datos del Emisor actualizados correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Emisor $emisor)
    {
        //
    }
}
