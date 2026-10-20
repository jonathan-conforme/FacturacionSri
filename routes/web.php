<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\EmisorController;
use App\Http\Controllers\NotaCreditoController;
use App\Http\Controllers\NotaDebitoController;
use App\Http\Controllers\GuiaRemisionController;
use App\Http\Controllers\RetencionController;

use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Facturas
    Route::resource('facturas', FacturaController::class);

    // Clientes
    Route::resource('clientes', ClienteController::class);

    // Emisor
    Route::resource('emisor', EmisorController::class);

    //NotaCredito
    Route::resource('notas-credito', NotaCreditoController::class);
    });

    //notadebito
    Route::get('/notas-debito/crear{factura?}', [NotaDebitoController::class, 'create'])->name('notas-debito.create');
    Route::post('/notas-debito', [NotaDebitoController::class, 'store'])->name('notas-debito.store');

    //GuiaRemision
    Route::resource('guias', GuiaRemisionController::class);
    Route::post('guias/{guia}/procesar-sri', [GuiaRemisionController::class, 'procesarSri'])->name('guias.procesarSri');

    //Retencion
    Route::resource('retenciones', RetencionController::class);

require __DIR__.'/auth.php';
