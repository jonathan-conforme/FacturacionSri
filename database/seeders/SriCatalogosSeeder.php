<?php

namespace Database\Seeders;

use App\Models\ImpuestoTarifa;
use App\Models\TipoComprobante;
use App\Models\TipoIdentificacion;
use Illuminate\Database\Seeder;

class SriCatalogosSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Tipos de Comprobantes según el SRI
        $comprobantes = [
            ['codigo' => '01', 'descripcion' => 'Factura', 'activo' => true],
            ['codigo' => '03', 'descripcion' => 'Liquidación de compra de bienes y prestación de servicios', 'activo' => true],
            ['codigo' => '04', 'descripcion' => 'Nota de Crédito', 'activo' => true],
            ['codigo' => '05', 'descripcion' => 'Nota de Débito', 'activo' => true],
            ['codigo' => '06', 'descripcion' => 'Guía de Remisión', 'activo' => true],
            ['codigo' => '07', 'descripcion' => 'Comprobante de Retención', 'activo' => true],
        ];

        foreach ($comprobantes as $comp) {
            TipoComprobante::updateOrCreate(['codigo' => $comp['codigo']], $comp);
        }

        // 2. Tarifas de IVA según Ficha Técnica Tabla 17
        $tarifasIva = [
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '0',  'descripcion' => '0%', 'porcentaje' => 0.00, 'activo' => true],
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '2',  'descripcion' => '12%', 'porcentaje' => 12.00, 'activo' => true],
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '3',  'descripcion' => '14%', 'porcentaje' => 14.00, 'activo' => true],
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '4',  'descripcion' => '15%', 'porcentaje' => 15.00, 'activo' => true],
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '5',  'descripcion' => '5%', 'porcentaje' => 5.00, 'activo' => true],
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '6',  'descripcion' => 'No Objeto de Impuesto', 'porcentaje' => 0.00, 'activo' => true],
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '7',  'descripcion' => 'Exento de IVA', 'porcentaje' => 0.00, 'activo' => true],
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '8',  'descripcion' => 'IVA Diferenciado', 'porcentaje' => 0.00, 'activo' => true],
            ['codigo_impuesto' => '2', 'codigo_porcentaje' => '10', 'descripcion' => '13%', 'porcentaje' => 13.00, 'activo' => true],
        ];

        foreach ($tarifasIva as $tarifa) {
            ImpuestoTarifa::updateOrCreate(['codigo_porcentaje' => $tarifa['codigo_porcentaje']], $tarifa);
        }

        // Tipos de Identificación
        $tiposIdentificacion = [
            ['codigo' => '04', 'descripcion' => 'RUC', 'activo' => true],
            ['codigo' => '05', 'descripcion' => 'CEDULA', 'activo' => true],
            ['codigo' => '06', 'descripcion' => 'PASAPORTE', 'activo' => true],
            ['codigo' => '07', 'descripcion' => 'CONSUMIDOR FINAL', 'activo' => true],
            ['codigo' => '08', 'descripcion' => 'IDENTIFICACION DEL EXTERIOR', 'activo' => true],
        ];

        foreach ($tiposIdentificacion as $tipo) {
            TipoIdentificacion::updateOrCreate(['codigo' => $tipo['codigo']], $tipo);
        }
    }
}
