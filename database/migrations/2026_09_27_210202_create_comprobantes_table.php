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
            // Factura que modifica esta nota de crédito (solo tipo 04)
            $table->foreignId('comprobante_modificado_id')
                ->nullable()
                ->constrained('comprobantes')
                ->nullOnDelete();

            $table->string('tipo_comprobante', 2); // 01: Factura, 04: Nota Crédito, 07: Retención, etc.
            $table->string('establecimiento', 3);
            $table->string('punto_emision', 3);
            $table->string('secuencial', 9);
            $table->string('clave_acceso', 49)->unique()->nullable(); // Clave de 49 dígitos numérico

            $table->date('fecha_emision'); //
            $table->decimal('total_sin_impuestos', 12, 2); //
            $table->decimal('subtotal_15', 12, 2)->default(0.00); // Base IVA 15% (código 4)
            $table->decimal('subtotal_0', 12, 2)->default(0.00);  // Base IVA 0% (código 0)
            $table->decimal('monto_iva', 12, 2)->default(0.00);
            $table->decimal('propina', 12, 2)->default(0.00);
            $table->string('motivo', 300)->nullable(); // Motivo de la nota de crédito
            $table->decimal('importe_total', 12, 2); //

            $table->string('periodo_fiscal', 7)->nullable(); // MM/YYYY

            // Trazabilidad y respuesta Web Service SRI
            $table->string('estado_sri')->default('CREADO'); // CREADO, RECIBIDO, AUTORIZADO, RECHAZADO, DEVUELTA
            $table->dateTime('fecha_autorizacion')->nullable();
            $table->text('mensajes_sri')->nullable(); // Para almacenar los errores o mensajes recibidos

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
