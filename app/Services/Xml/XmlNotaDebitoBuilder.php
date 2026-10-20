<?php

namespace App\Services\Xml;

use App\Models\Comprobante;
use Carbon\Carbon;
use SimpleXMLElement;

class XmlNotaDebitoBuilder
{
    public function build(Comprobante $comprobante): string
    {
        $comprobante->load(['emisor', 'cliente', 'motivos', 'comprobanteModificado']);

        $emisor = $comprobante->emisor;
        $cliente = $comprobante->cliente;
        $factura = $comprobante->comprobanteModificado;

        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><notaDebito id="comprobante" version="1.0.0"></notaDebito>');

        // 1. Info Tributaria
        $infoTributaria = $xml->addChild('infoTributaria');
        $infoTributaria->addChild('ambiente', $emisor->ambiente);
        $infoTributaria->addChild('tipoEmision', '1');
        $infoTributaria->addChild('razonSocial', $this->esc($emisor->razon_social));

        if (! empty($emisor->nombre_comercial)) {
            $infoTributaria->addChild('nombreComercial', $this->esc($emisor->nombre_comercial));
        }

        $infoTributaria->addChild('ruc', $emisor->ruc);
        $infoTributaria->addChild('claveAcceso', $comprobante->clave_acceso);
        $infoTributaria->addChild('codDoc', '05'); // 05 = Nota de Débito
        $infoTributaria->addChild('estab', str_pad($comprobante->establecimiento, 3, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('ptoEmi', str_pad($comprobante->punto_emision, 3, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('secuencial', str_pad($comprobante->secuencial, 9, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('dirMatriz', $this->esc($emisor->dir_matriz));

        // 2. Info Nota Débito
        $infoND = $xml->addChild('infoNotaDebito');
        $infoND->addChild('fechaEmision', Carbon::parse($comprobante->fecha_emision)->format('d/m/Y'));
        $infoND->addChild('dirEstablecimiento', $this->esc($emisor->dir_establecimiento ?? $emisor->dir_matriz));
        $infoND->addChild('tipoIdentificacionComprador', $cliente->tipo_identificacion_codigo);
        $infoND->addChild('razonSocialComprador', $this->esc($cliente->razon_social));
        $infoND->addChild('identificacionComprador', $cliente->identificacion);

        if (! empty($emisor->contribuyente_especial)) {
            $infoND->addChild('contribuyenteEspecial', $emisor->contribuyente_especial);
        }

        $infoND->addChild('obligadoContabilidad', strtoupper($emisor->obligado_contabilidad) === 'SI' ? 'SI' : 'NO');

        // Datos del documento sustentatorio (Factura original)
        $numDocModificado = sprintf(
            '%s-%s-%s',
            str_pad($factura?->establecimiento ?? $comprobante->establecimiento, 3, '0', STR_PAD_LEFT),
            str_pad($factura?->punto_emision ?? $comprobante->punto_emision, 3, '0', STR_PAD_LEFT),
            str_pad($factura?->secuencial ?? '000000001', 9, '0', STR_PAD_LEFT)
        );

        $fechaDocModificado = $factura?->fecha_emision 
            ? Carbon::parse($factura->fecha_emision)->format('d/m/Y')
            : Carbon::parse($comprobante->fecha_emision)->format('d/m/Y');

        $infoND->addChild('codDocModificado', '01');
        $infoND->addChild('numDocModificado', $numDocModificado);
        $infoND->addChild('fechaEmisionDocSustento', $fechaDocModificado);

        $infoND->addChild('totalSinImpuestos', $this->num($comprobante->total_sin_impuestos));

        // Impuestos
        $impuestosNode = $infoND->addChild('impuestos');

        if (($comprobante->subtotal_15 ?? 0) > 0) {
            $impuestoNode = $impuestosNode->addChild('impuesto');
            $impuestoNode->addChild('codigo', '2'); // 2 = IVA
            $impuestoNode->addChild('codigoPorcentaje', '4'); // 4 = IVA 15%
            $impuestoNode->addChild('tarifa', '15.00');
            $impuestoNode->addChild('baseImponible', $this->num($comprobante->subtotal_15));
            $impuestoNode->addChild('valor', $this->num($comprobante->monto_iva));
        }

        if (($comprobante->subtotal_0 ?? 0) > 0 || (($comprobante->subtotal_15 ?? 0) == 0 && ($comprobante->subtotal_0 ?? 0) == 0)) {
            $impuestoNode = $impuestosNode->addChild('impuesto');
            $impuestoNode->addChild('codigo', '2');
            $impuestoNode->addChild('codigoPorcentaje', '0'); // 0 = IVA 0%
            $impuestoNode->addChild('tarifa', '0.00');
            $impuestoNode->addChild('baseImponible', $this->num($comprobante->subtotal_0 ?? 0));
            $impuestoNode->addChild('valor', '0.00');
        }

        $infoND->addChild('valorTotal', $this->num($comprobante->importe_total));

        // Pagos
        $pagosNode = $infoND->addChild('pagos');
        $pagoNode = $pagosNode->addChild('pago');
        $pagoNode->addChild('formaPago', $comprobante->forma_pago ?? '20');
        $pagoNode->addChild('total', $this->num($comprobante->importe_total));

        // 3. Motivos
        $motivosNode = $xml->addChild('motivos');
        foreach ($comprobante->motivos as $motivo) {
            $motivoNode = $motivosNode->addChild('motivo');
            $motivoNode->addChild('razon', $this->esc($motivo->razon));
            $motivoNode->addChild('valor', $this->num($motivo->valor));
        }

        // 4. Info Adicional
        if (! empty($cliente->email)) {
            $infoAdicional = $xml->addChild('infoAdicional');
            $campo = $infoAdicional->addChild('campoAdicional', $this->esc($cliente->email));
            $campo->addAttribute('nombre', 'Email');
        }

        return $xml->asXML();
    }

    private function esc(?string $valor): string
    {
        return htmlspecialchars((string) $valor, ENT_XML1, 'UTF-8');
    }

    private function num($valor): string
    {
        return number_format((float) $valor, 2, '.', '');
    }
}