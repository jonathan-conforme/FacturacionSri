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
        Schema::create('tipo_comprobantes', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 2)->unique(); // Ej: '01', '04', '07'
            $table->string('descripcion'); // Ej: 'Factura', 'Nota de Crédito'[cite: 4]
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipo_comprobantes');
    }
};
