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
        Schema::create('tipo_identificacions', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 2)->unique(); // Ej: '04', '05', '06', '07', '08'
            $table->string('descripcion');        // Ej: 'RUC', 'Cédula', 'Pasaporte'
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipo_identificacions');
    }
};
