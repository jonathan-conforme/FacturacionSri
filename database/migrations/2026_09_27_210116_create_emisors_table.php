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
        Schema::create('emisors', function (Blueprint $table) {
            $table->id();
            $table->string('ruc', 13)->unique(); //
            $table->string('razon_social');
            $table->string('nombre_comercial')->nullable();
            $table->string('dir_matriz');
            $table->string('dir_establecimiento')->nullable();
            $table->string('codigo_establecimiento', 3)->default('001'); //[cite: 4]
            $table->string('punto_emision', 3)->default('001'); //[cite: 4]
            $table->enum('ambiente', ['1', '2'])->default('1'); // 1: Pruebas, 2: Producción[cite: 4]
            $table->string('contribuyente_especial')->nullable();
            $table->string('obligado_contabilidad', 2)->default('NO');
            $table->string('p12_path')->nullable(); // Ruta del archivo .p12 o .pfx[cite: 4]
            $table->text('p12_password')->nullable(); // Contraseña cifrada del certificado
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emisors');
    }
};
