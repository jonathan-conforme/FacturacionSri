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
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_identificacion_codigo', 2);
            $table->string('identificacion'); // 04: RUC, 05: Cédula, 06: Pasaporte, 07: Consumidor Final, 08: Exterior[cite: 4]
            $table->string('razon_social');
            $table->string('direccion')->nullable();
            $table->string('email')->nullable();
            $table->string('telefono')->nullable();
            $table->timestamps();

           // Relación con la tabla tipo_identificacions (asumiendo que la columna primaria/clave se llama 'codigo' o 'id')
        $table->foreign('tipo_identificacion_codigo')
              ->references('codigo')
              ->on('tipo_identificacions')
              ->onDelete('cascade');

            // Índice para consultas
        $table->index(['tipo_identificacion_codigo', 'identificacion']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
