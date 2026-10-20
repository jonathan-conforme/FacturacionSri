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
        Schema::create('retencion_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comprobante_id')->constrained('comprobantes')->cascadeOnDelete();

            // Sustento tributario
            $table->string('cod_sustento', 2)->default('01'); // 01: Crédito tributario
            $table->string('cod_doc_sustento', 2)->default('01'); // 01: Factura
            $table->string('num_doc_sustento', 15); // ej: 001001000000123
            $table->date('fecha_emision_doc_sustento');

            // Detalle del impuesto retenido
            $table->string('codigo_impuesto', 1); // 1: Renta, 2: IVA, 6: ISD
            $table->string('codigo_retencion', 5); // Código SRI (ej. 312, 3440, 2)
            $table->decimal('base_imponible', 12, 2);
            $table->decimal('porcentaje_retener', 5, 2);
            $table->decimal('valor_retenido', 12, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retencion_detalles');
    }
};
