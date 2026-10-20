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
        Schema::create('guia_remision_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guia_remision_id')->constrained('guia_remisions')->onDelete('cascade');
            $table->string('codigo_interno');
            $table->string('codigo_adicional')->nullable();
            $table->string('descripcion');
            $table->decimal('cantidad', 12, 6);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guia_remision_detalles');
    }
};
