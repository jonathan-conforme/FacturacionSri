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
        Schema::create('guia_remisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emisor_id')->constrained('emisors');
            $table->foreignId('cliente_id')->constrained('clientes');
            $table->foreignId('comprobante_id')->nullable()->constrained('comprobantes')->nullOnDelete();

            $table->string('establecimiento', 3);
            $table->string('punto_emision', 3);
            $table->string('secuencial', 9);
            $table->string('clave_acceso', 49)->unique()->nullable();
            $table->date('fecha_emision');

            // Transporte
            $table->string('dir_partida');
            $table->string('tipo_identificacion_transportista', 2);
            $table->string('identificacion_transportista', 20);
            $table->string('razon_social_transportista');
            $table->string('placa', 20);
            $table->date('fecha_inicio_transporte');
            $table->date('fecha_fin_transporte');

            // Destino y Sustento
            $table->string('dir_destinatario');
            $table->string('motivo_traslado', 300);
            $table->string('ruta', 300)->nullable();
            $table->string('cod_doc_sustento', 2)->default('01');
            $table->string('num_doc_sustento', 17)->nullable();
            $table->string('num_aut_doc_sustento', 49)->nullable();
            $table->date('fecha_emision_doc_sustento')->nullable();

            // Estado SRI
            $table->string('estado_sri')->default('CREADO');
            $table->dateTime('fecha_autorizacion')->nullable();
            $table->text('mensajes_sri')->nullable();

            // Ubicación de archivos en disco
            $table->string('xml_generado_path')->nullable();
            $table->string('xml_firmado_path')->nullable();
            $table->string('pdf_ride_path')->nullable();

            $table->timestamps();

           // Índices de búsqueda
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
        Schema::dropIfExists('guia_remisions');
    }
};
