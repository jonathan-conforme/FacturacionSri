<?php

namespace App\Http\Controllers;

use App\Http\Requests\Factura\StoreClienteRequest;
use App\Services\CatalogosService;
use App\Services\ClienteService;
use App\Models\Cliente;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{

   // Inyectamos y declaramos los servicios como propiedades de la clase
    public function __construct(
        protected ClienteService $clienteService,
        protected CatalogosService $catalogosService
    ) {}

  public function index(): Response
    {
        return Inertia::render('Clientes/Index', [
            'clientes' => Cliente::with('tipoIdentificacion')->latest()->paginate(15)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
   public function create(): Response
    {
        return Inertia::render('Clientes/Create', [
            'tiposIdentificacion' => $this->catalogosService->obtenerTiposIdentificacion()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
   public function store(StoreClienteRequest $request)
    {
        $this->clienteService->crearCliente($request->validated());

        return redirect()->route('clientes.index')->with('success', 'Cliente registrado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Cliente $cliente)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Cliente $cliente)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Cliente $cliente)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cliente $cliente)
    {
        //
    }
}
