<?php

namespace App\Http\Controllers;

use App\Http\Requests\Factura\StoreFacturaRequest;
use App\Models\Cliente;
use App\Services\CatalogosService;
use App\Models\Comprobante;
use App\Models\ImpuestoTarifa;
use App\Services\FacturaService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class FacturaController extends Controller
{
    public function __construct(
        protected FacturaService $facturaService,
        protected CatalogosService $catalogosService,
    ) {}

    /**
     * Muestra la lista de comprobantes generados.
     */
   public function index(Request $request): Response
    {
        $comprobantes = Comprobante::with(['cliente', 'emisor'])
            ->when($request->search, function ($query, $search) {
                $query->where('clave_acceso', 'like', "%{$search}%")
                      ->orWhere('secuencial', 'like', "%{$search}%")
                      ->orWhereHas('cliente', function ($q) use ($search) {
                          $q->where('razon_social', 'like', "%{$search}%")
                            ->orWhere('identificacion', 'like', "%{$search}%");
                      });
            })
            ->when($request->estado, function ($query, $estado) {
                $query->where('estado_sri', $estado);
            })
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Facturas/Index', [
            'comprobantes' => $comprobantes,
            'filters' => $request->Only(['search', 'estado']),
        ]);
    }

    /**
     * Formulario para emitir una nueva factura.
     */
    public function create(): Response
    {
        return Inertia::render('Facturas/Create', $this->catalogosService->obtenerDatosParaFactura());
    }

    /**
     * Almacena y procesa la nueva factura.
     */
    public function store(StoreFacturaRequest $request)
    {
       try {
            $comprobante = $this->facturaService->crearYProcesarFactura($request->validated());

           return redirect()->route('facturas.index')
            ->with('success', 'Comprobante procesado con éxito.');
    } catch (\Exception $e) {
        return redirect()->back()
            ->with('error', 'No se pudo completar el proceso: ' . $e->getMessage());
    }
    }
}
