<?php

namespace App\Services\Xml;

use App\Models\Comprobante;
use Carbon\Carbon;
use SimpleXMLElement;

/**
 * Genera el XML de Nota de Crédito (codDoc 04), versión 1.1.0.
 * Orden de etiquetas tomado de la ficha técnica del SRI (v2.26).
 */
class XmlNotaCreditoBuilder
{
    public function generarXml(Comprobante $nc): string
    {
        $nc->load(['emisor', 'cliente', 'detalles', 'comprobanteModificado']);

        $emisor = $nc->emisor;
        $cliente = $nc->cliente;
        $factura = $nc->comprobanteModificado;

        $xml = new SimpleXMLElement(
            '<?xml version="1.0" encoding="UTF-8"?><notaCredito id="comprobante" version="1.1.0"></notaCredito>'
        );

        // 1. infoTributaria (igual que en factura, cambia codDoc)
        $tributaria = $xml->addChild('infoTributaria');
        $tributaria->addChild('ambiente', $emisor->ambiente);
        $tributaria->addChild('tipoEmision', '1');
        $tributaria->addChild('razonSocial', $this->esc($emisor->razon_social));

        if (! empty($emisor->nombre_comercial)) {
            $tributaria->addChild('nombreComercial', $this->esc($emisor->nombre_comercial));
        }

        $tributaria->addChild('ruc', $emisor->ruc);
        $tributaria->addChild('claveAcceso', $nc->clave_acceso);
        $tributaria->addChild('codDoc', '04'); // 04: Nota de crédito
        $tributaria->addChild('estab', str_pad($nc->establecimiento, 3, '0', STR_PAD_LEFT));
        $tributaria->addChild('ptoEmi', str_pad($nc->punto_emision, 3, '0', STR_PAD_LEFT));
        $tributaria->addChild('secuencial', str_pad($nc->secuencial, 9, '0', STR_PAD_LEFT));
        $tributaria->addChild('dirMatriz', $this->esc($emisor->dir_matriz));

        // 2. infoNotaCredito (el orden importa)
        $info = $xml->addChild('infoNotaCredito');
        $info->addChild('fechaEmision', Carbon::parse($nc->fecha_emision)->format('d/m/Y'));
        $info->addChild('dirEstablecimiento', $this->esc($emisor->dir_establecimiento ?? $emisor->dir_matriz));
        $info->addChild('tipoIdentificacionComprador', $cliente->tipo_identificacion_codigo);
        $info->addChild('razonSocialComprador', $this->esc($cliente->razon_social));
        $info->addChild('identificacionComprador', $cliente->identificacion);

        if (! empty($emisor->contribuyente_especial)) {
            $info->addChild('contribuyenteEspecial', $emisor->contribuyente_especial);
        }

        $info->addChild('obligadoContabilidad', strtoupper($emisor->obligado_contabilidad) === 'SI' ? 'SI' : 'NO');

        // Documento que se modifica
        $info->addChild('codDocModificado', '01'); // 01: Factura
        $info->addChild('numDocModificado', sprintf(
            '%s-%s-%s',
            str_pad($factura->establecimiento, 3, '0', STR_PAD_LEFT),
            str_pad($factura->punto_emision, 3, '0', STR_PAD_LEFT),
            str_pad($factura->secuencial, 9, '0', STR_PAD_LEFT)
        ));
        $info->addChild('fechaEmisionDocSustento', Carbon::parse($factura->fecha_emision)->format('d/m/Y'));

        $info->addChild('totalSinImpuestos', $this->num($nc->total_sin_impuestos));
        $info->addChild('valorModificacion', $this->num($nc->importe_total));
        $info->addChild('moneda', 'DOLAR');

        // totalConImpuestos: SIN etiqueta tarifa (no existe en este nivel)
        $totales = $info->addChild('totalConImpuestos');

        if ($nc->subtotal_15 > 0) {
            $ti = $totales->addChild('totalImpuesto');
            $ti->addChild('codigo', '2');
            $ti->addChild('codigoPorcentaje', '4'); // IVA 15%
            $ti->addChild('baseImponible', $this->num($nc->subtotal_15));
            $ti->addChild('valor', $this->num($nc->monto_iva));
        }

        if ($nc->subtotal_0 > 0 || ($nc->subtotal_15 == 0 && $nc->subtotal_0 == 0)) {
            $ti = $totales->addChild('totalImpuesto');
            $ti->addChild('codigo', '2');
            $ti->addChild('codigoPorcentaje', '0'); // IVA 0%
            $ti->addChild('baseImponible', $this->num($nc->subtotal_0 ?? 0));
            $ti->addChild('valor', '0.00');
        }

        $info->addChild('motivo', $this->esc($nc->motivo));

        // 3. detalles (en nota de crédito: codigoInterno / codigoAdicional)
        $detalles = $xml->addChild('detalles');

        foreach ($nc->detalles as $det) {
            $detalle = $detalles->addChild('detalle');
            $detalle->addChild('codigoInterno', $this->esc($det->codigo_principal));

            if (! empty($det->codigo_auxiliar)) {
                $detalle->addChild('codigoAdicional', $this->esc($det->codigo_auxiliar));
            }

            $detalle->addChild('descripcion', $this->esc($det->descripcion));
            $detalle->addChild('cantidad', number_format($det->cantidad, 6, '.', ''));
            $detalle->addChild('precioUnitario', number_format($det->precio_unitario, 6, '.', ''));
            $detalle->addChild('descuento', $this->num($det->descuento ?? 0));
            $detalle->addChild('precioTotalSinImpuesto', $this->num($det->precio_total_sin_impuesto));

            $impuestos = $detalle->addChild('impuestos');
            $impuesto = $impuestos->addChild('impuesto');
            $impuesto->addChild('codigo', $det->codigo_impuesto ?: '2');
            $impuesto->addChild('codigoPorcentaje', $det->codigo_porcentaje);
            $impuesto->addChild('tarifa', $this->num($det->tarifa)); // aquí sí va tarifa
            $impuesto->addChild('baseImponible', $this->num($det->base_imponible));
            $impuesto->addChild('valor', $this->num($det->valor_impuesto));
        }

        // 4. infoAdicional (solo si hay datos)
        if (! empty($cliente->email)) {
            $adicional = $xml->addChild('infoAdicional');
            $campo = $adicional->addChild('campoAdicional', $this->esc($cliente->email));
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
