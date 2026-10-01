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
        Schema::create('impuesto_tarifas', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_impuesto', 2)->default('2'); // 2: IVA, 3: ICE, 5: IRBPNR[cite: 4]
            $table->string('codigo_porcentaje', 4)->unique();  // Ej: '0', '2', '4', '5'[cite: 4]
            $table->string('descripcion');                      // Ej: 'IVA 15%', 'IVA 0%', 'IVA 5%'[cite: 4]
            $table->decimal('porcentaje', 5, 2);               // Ej: 15.00, 0.00, 5.00
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('impuesto_tarifas');
    }
};
