<?php

namespace App\Services\Xml;

use App\Models\Comprobante;
use Carbon\Carbon;
use SimpleXMLElement;

class XmlFacturaBuilder
{
    public function generarXml(Comprobante $comprobante): string
    {
        $comprobante->load(['emisor', 'cliente', 'detalles']);
        $emisor = $comprobante->emisor;
        $cliente = $comprobante->cliente;

        // Crear la estructura raíz con versión 1.1.0
        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><factura id="comprobante" version="1.1.0"></factura>');

        // 1. InfoTributaria
        $infoTributaria = $xml->addChild('infoTributaria');
        $infoTributaria->addChild('ambiente', $emisor->ambiente);
        $infoTributaria->addChild('tipoEmision', '1');
        $infoTributaria->addChild('razonSocial', htmlspecialchars($emisor->razon_social, ENT_XML1, 'UTF-8'));

        if (! empty($emisor->nombre_comercial)) {
            $infoTributaria->addChild('nombreComercial', htmlspecialchars($emisor->nombre_comercial, ENT_XML1, 'UTF-8'));
        }

        $infoTributaria->addChild('ruc', $emisor->ruc);
        $infoTributaria->addChild('claveAcceso', $comprobante->clave_acceso);
        $infoTributaria->addChild('codDoc', '01'); // 01: Factura
        $infoTributaria->addChild('estab', str_pad($comprobante->establecimiento, 3, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('ptoEmi', str_pad($comprobante->punto_emision, 3, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('secuencial', str_pad($comprobante->secuencial, 9, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('dirMatriz', htmlspecialchars($emisor->dir_matriz, ENT_XML1, 'UTF-8'));

        // 2. InfoFactura
        $infoFactura = $xml->addChild('infoFactura');
        $infoFactura->addChild('fechaEmision', Carbon::parse($comprobante->fecha_emision)->format('d/m/Y'));
        $infoFactura->addChild('dirEstablecimiento', htmlspecialchars($emisor->dir_establecimiento ?? $emisor->dir_matriz, ENT_XML1, 'UTF-8'));

        if (! empty($emisor->contribuyente_especial)) {
            $infoFactura->addChild('contribuyenteEspecial', $emisor->contribuyente_especial);
        }

        $infoFactura->addChild('obligadoContabilidad', strtoupper($emisor->obligado_contabilidad) === 'SI' ? 'SI' : 'NO');
        $infoFactura->addChild('tipoIdentificacionComprador', $cliente->tipo_identificacion_codigo);
        $infoFactura->addChild('razonSocialComprador', htmlspecialchars($cliente->razon_social, ENT_XML1, 'UTF-8'));
        $infoFactura->addChild('identificacionComprador', $cliente->identificacion);

        if (! empty($cliente->direccion)) {
            $infoFactura->addChild('direccionComprador', htmlspecialchars($cliente->direccion, ENT_XML1, 'UTF-8'));
        }

        $infoFactura->addChild('totalSinImpuestos', number_format($comprobante->total_sin_impuestos, 2, '.', ''));
        $infoFactura->addChild('totalDescuento', number_format($comprobante->total_descuento ?? 0, 2, '.', ''));

       // Total Con Impuestos
$totalConImpuestos = $infoFactura->addChild('totalConImpuestos');

if ($comprobante->subtotal_15 > 0) {
    $ti = $totalConImpuestos->addChild('totalImpuesto');
    $ti->addChild('codigo', '2');
    $ti->addChild('codigoPorcentaje', '4');   // 15% según tabla 17
    $ti->addChild('baseImponible', number_format($comprobante->subtotal_15, 2, '.', ''));
    $ti->addChild('valor', number_format($comprobante->monto_iva, 2, '.', ''));
}

if ($comprobante->subtotal_0 > 0 || ($comprobante->subtotal_15 == 0 && $comprobante->subtotal_0 == 0)) {
    $ti = $totalConImpuestos->addChild('totalImpuesto');
    $ti->addChild('codigo', '2');
    $ti->addChild('codigoPorcentaje', '0');
    $ti->addChild('baseImponible', number_format($comprobante->subtotal_0 ?? 0, 2, '.', ''));
    $ti->addChild('valor', '0.00');
}

$infoFactura->addChild('propina', '0.00');
$infoFactura->addChild('importeTotal', number_format($comprobante->importe_total, 2, '.', ''));
$infoFactura->addChild('moneda', 'DOLAR');

$pagos = $infoFactura->addChild('pagos');
$pago = $pagos->addChild('pago');
$pago->addChild('formaPago', '01');
$pago->addChild('total', number_format($comprobante->importe_total, 2, '.', ''));  // ✅
        // 3. Detalles
        $detalles = $xml->addChild('detalles');
        foreach ($comprobante->detalles as $det) {
            $detalle = $detalles->addChild('detalle');
            $detalle->addChild('codigoPrincipal', htmlspecialchars($det->codigo_principal, ENT_XML1, 'UTF-8'));
            $detalle->addChild('descripcion', htmlspecialchars($det->descripcion, ENT_XML1, 'UTF-8'));
            $detalle->addChild('cantidad', number_format($det->cantidad, 2, '.', ''));
            $detalle->addChild('precioUnitario', number_format($det->precio_unitario, 2, '.', ''));
            $detalle->addChild('descuento', number_format($det->descuento ?? 0, 2, '.', ''));
            $detalle->addChild('precioTotalSinImpuesto', number_format($det->precio_total_sin_impuesto, 2, '.', ''));

            // Impuestos del detalle corregidos
            $impuestos = $detalle->addChild('impuestos');
            $impuesto = $impuestos->addChild('impuesto');
            $impuesto->addChild('codigo', '2'); // 2 = IVA
            $impuesto->addChild('codigoPorcentaje', $det->codigo_porcentaje); // '4' para 15%
            $impuesto->addChild('tarifa', number_format($det->tarifa, 2, '.', ''));
            $impuesto->addChild('baseImponible', number_format($det->base_imponible, 2, '.', ''));
            $impuesto->addChild('valor', number_format($det->valor_impuesto, 2, '.', ''));
        }

        // 4. InfoAdicional
        if ($cliente->email || $cliente->direccion) {
            $infoAdicional = $xml->addChild('infoAdicional');
            if ($cliente->email) {
                $campoEmail = $infoAdicional->addChild('campoAdicional', htmlspecialchars($cliente->email, ENT_XML1, 'UTF-8'));
                $campoEmail->addAttribute('nombre', 'Email');
            }
            if ($cliente->direccion) {
                $campoDir = $infoAdicional->addChild('campoAdicional', htmlspecialchars($cliente->direccion, ENT_XML1, 'UTF-8'));
                $campoDir->addAttribute('nombre', 'Direccion');
            }
        }

        return $xml->asXML();
    }
}
