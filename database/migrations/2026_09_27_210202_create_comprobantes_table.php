<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('comprobantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emisor_id')->constrained('emisors');
            $table->foreignId('cliente_id')->constrained('clientes');

            $table->string('tipo_comprobante', 2); // 01: Factura, 04: Nota Crédito, 07: Retención, etc.[cite: 4]
            $table->string('establecimiento', 3); // [cite: 4]
            $table->string('punto_emision', 3); // [cite: 4]
            $table->string('secuencial', 9); // [cite: 4]
            $table->string('clave_acceso', 49)->unique()->nullable(); // Clave de 49 dígitos numéricos[cite: 4]

            $table->date('fecha_emision'); // [cite: 4]
            $table->decimal('total_sin_impuestos', 12, 2); // [cite: 4]
            $table->decimal('subtotal_15', 12, 2)->default(0.00); // Base IVA 15% (código 4)[cite: 4]
            $table->decimal('subtotal_0', 12, 2)->default(0.00);  // Base IVA 0% (código 0)[cite: 4]
            $table->decimal('monto_iva', 12, 2)->default(0.00);
            $table->decimal('propina', 12, 2)->default(0.00);
            $table->decimal('importe_total', 12, 2); // [cite: 4]

            // Trazabilidad y respuesta Web Service SRI
            $table->string('estado_sri')->default('CREADO'); // CREADO, RECIBIDO, AUTORIZADO, RECHAZADO, DEVUELTA[cite: 4]
            $table->dateTime('fecha_autorizacion')->nullable();
            $table->text('mensajes_sri')->nullable(); // Para almacenar los errores o mensajes recibidos[cite: 4]

            // Ubicación de archivos en disco
            $table->string('xml_generado_path')->nullable();
            $table->string('xml_firmado_path')->nullable();
            $table->string('pdf_ride_path')->nullable();
            $table->timestamps();

            // indice de busqueda masiva
            $table->index(['establecimiento', 'punto_emision', 'secuencial']);
            $table->index('fecha_emision');
            $table->index('estado_sri');
            $table->index(['emisor_id', 'estado_sri']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comprobantes');
    }
};
