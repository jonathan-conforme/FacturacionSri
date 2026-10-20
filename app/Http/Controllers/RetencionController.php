<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreRetencionRequest;
use App\Models\Cliente;
use App\Models\Comprobante;
use App\Models\Emisor;
use App\Services\RetencionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RetencionController extends Controller
{
    public function __construct(protected RetencionService $retencionService) {}

    public function index(): Response
    {
        $retenciones = Comprobante::with(['cliente', 'emisor'])
            ->where('tipo_comprobante', '07')
            ->latest()
            ->paginate(10);

        return Inertia::render('Retenciones/Index', [
            'retenciones' => $retenciones
        ]);
    }

    public function create(Request $request): Response
    {
        // Cargar proveedores (clientes) y emisores para las listas desplegables
        $proveedores = Cliente::all();
        $emisors = Emisor::all();

        // Opcional: Si se pasa un factura_id por query string (ej: /retenciones/create?factura_id=1)
        $facturaSustento = null;
        if ($request->has('factura_id')) {
            $facturaSustento = Comprobante::with('cliente')
                ->where('id', $request->query('factura_id'))
                ->first();
        }

        return Inertia::render('Retenciones/Create', [
            'proveedores' => $proveedores,
            'emisores' => $emisors,
            'facturaSustento' => $facturaSustento,
        ]);
    }

    public function store(StoreRetencionRequest $request)
    {
        $comprobante = $this->retencionService->crear($request->validated());

        return redirect()->route('retenciones.index')->with('message', [
            'type' => $comprobante->estado_sri === 'AUTORIZADO' ? 'success' : 'warning',
            'text' => "Comprobante de retención procesado: {$comprobante->estado_sri}"
        ]);
    }
}
