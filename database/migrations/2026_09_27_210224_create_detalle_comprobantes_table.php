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
        Schema::create('detalle_comprobantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comprobante_id')->constrained('comprobantes')->onDelete('cascade');

            $table->string('codigo_principal');
            $table->string('codigo_auxiliar')->nullable();
            $table->string('descripcion');
            $table->decimal('cantidad', 12, 6); // La ficha permite hasta 6 decimales[cite: 4]
            $table->decimal('precio_unitario', 12, 6); // Permite hasta 6 decimales[cite: 4]
            $table->decimal('descuento', 12, 2)->default(0.00);
            $table->decimal('precio_total_sin_impuesto', 12, 2); //[cite: 4]

            $table->string('codigo_impuesto', 2)->default('2'); // 2: IVA[cite: 4]
            $table->string('codigo_porcentaje', 2)->default('4'); // 4: 15%, 0: 0%[cite: 4]
            $table->decimal('tarifa', 5, 2)->default(15.00); //[cite: 4]
            $table->decimal('base_imponible', 12, 2);
            $table->decimal('valor_impuesto', 12, 2);
            $table->timestamps();

            //Índice por código de producto
            $table->index('codigo_principal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_comprobantes');
    }
};
