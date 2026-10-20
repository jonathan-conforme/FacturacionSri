<?php
namespace App\Services\Xml;

use App\Models\Comprobante;
use Carbon\Carbon;
use SimpleXMLElement;

class XmlRetencionBuilder
{
    public function build(Comprobante $comprobante): string
    {
        $comprobante->load(['emisor', 'cliente', 'retencionDetalles']);

        $emisor = $comprobante->emisor;
        $proveedor = $comprobante->cliente;

        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><comprobanteRetencion id="comprobante" version="2.0.0"></comprobanteRetencion>');

        // 1. Info Tributaria
        $infoTributaria = $xml->addChild('infoTributaria');
        $infoTributaria->addChild('ambiente', $emisor->ambiente ?? '1');
        $infoTributaria->addChild('tipoEmision', '1');
        $infoTributaria->addChild('razonSocial', $this->esc($emisor->razon_social));

        if (! empty($emisor->nombre_comercial)) {
            $infoTributaria->addChild('nombreComercial', $this->esc($emisor->nombre_comercial));
        }

        $infoTributaria->addChild('ruc', $emisor->ruc);
        $infoTributaria->addChild('claveAcceso', $comprobante->clave_acceso);
        $infoTributaria->addChild('codDoc', '07');
        $infoTributaria->addChild('estab', str_pad($comprobante->establecimiento, 3, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('ptoEmi', str_pad($comprobante->punto_emision, 3, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('secuencial', str_pad($comprobante->secuencial, 9, '0', STR_PAD_LEFT));
        $infoTributaria->addChild('dirMatriz', $this->esc($emisor->dir_matriz));

        // 2. Info Comp Retencion
        $infoComp = $xml->addChild('infoCompRetencion');
        $infoComp->addChild('fechaEmision', Carbon::parse($comprobante->fecha_emision)->format('d/m/Y'));

        if (! empty($emisor->dir_establecimiento)) {
            $infoComp->addChild('dirEstablecimiento', $this->esc($emisor->dir_establecimiento));
        }

        if (! empty($emisor->contribuyente_especial)) {
            $infoComp->addChild('contribuyenteEspecial', $emisor->contribuyente_especial);
        }

        $infoComp->addChild('obligadoContabilidad', strtoupper($emisor->obligado_contabilidad ?? 'NO') === 'SI' ? 'SI' : 'NO');
        $infoComp->addChild('tipoIdentificacionSujetoRetenido', $proveedor->tipo_identificacion_codigo);
        $infoComp->addChild('parteRel', 'NO');
        $infoComp->addChild('razonSocialSujetoRetenido', $this->esc($proveedor->razon_social));
        $infoComp->addChild('identificacionSujetoRetenido', $proveedor->identificacion);
        $infoComp->addChild('periodoFiscal', $comprobante->periodo_fiscal ?? Carbon::parse($comprobante->fecha_emision)->format('m/Y'));

        // 3. Documentos Sustento y Retenciones (SRI v2.0.0)
        $docsSustentoNode = $xml->addChild('docsSustento');

        $detallesPorDoc = $comprobante->retencionDetalles->groupBy('num_doc_sustento');

        foreach ($detallesPorDoc as $numDoc => $detalles) {
            $primerDetalle = $detalles->first();
            $docSustentoNode = $docsSustentoNode->addChild('docSustento');

            $numDocLimpio = str_replace('-', '', $numDoc);
            $numDocFormatted = str_pad($numDocLimpio, 15, '0', STR_PAD_LEFT);

            $docSustentoNode->addChild('codSustento', $primerDetalle->cod_sustento ?? '01');
            $docSustentoNode->addChild('codDocSustento', $primerDetalle->cod_doc_sustento ?? '01');
            $docSustentoNode->addChild('numDocSustento', $numDocFormatted);
            $docSustentoNode->addChild('fechaEmisionDocSustento', Carbon::parse($primerDetalle->fecha_emision_doc_sustento)->format('d/m/Y'));

            // a. Pago Local / Exterior ('01': Pago Local, '02': Pago Exterior)
            $docSustentoNode->addChild('pagoLocExt', '01');

            // b. Totales del Documento Sustento
            $baseImponibleTotal = $detalles->sum('base_imponible');
            $docSustentoNode->addChild('totalSinImpuestos', $this->num($baseImponibleTotal));
            $docSustentoNode->addChild('importeTotal', $this->num($baseImponibleTotal));

            // c. Impuestos del Documento Sustento
            $impuestosDocNode = $docSustentoNode->addChild('impuestosDocSustento');
            $impuestoDoc = $impuestosDocNode->addChild('impuestoDocSustento');
            $impuestoDoc->addChild('codImpuestoDocSustento', '2'); // 2: IVA
            $impuestoDoc->addChild('codigoPorcentaje', '0'); // 0: 0% / Exento
            $impuestoDoc->addChild('baseImponible', $this->num($baseImponibleTotal));
            $impuestoDoc->addChild('tarifa', '0.00');
            $impuestoDoc->addChild('valorImpuesto', '0.00');

            // d. Retenciones Aplicadas
            $retencionesNode = $docSustentoNode->addChild('retenciones');
            foreach ($detalles as $det) {
                $retencionNode = $retencionesNode->addChild('retencion');
                $retencionNode->addChild('codigo', $det->codigo_impuesto);
                $retencionNode->addChild('codigoRetencion', $det->codigo_retencion);
                $retencionNode->addChild('baseImponible', $this->num($det->base_imponible));
                $retencionNode->addChild('porcentajeRetener', $this->num($det->porcentaje_retener));
                $retencionNode->addChild('valorRetenido', $this->num($det->valor_retenido));
            }

            // e. Forma de Pago
            $pagosNode = $docSustentoNode->addChild('pagos');
            $pagoNode = $pagosNode->addChild('pago');
            $pagoNode->addChild('formaPago', '20'); // 20: Otros con utilización del sistema financiero
            $pagoNode->addChild('total', $this->num($baseImponibleTotal));
        }

        // 4. Info Adicional
        if (! empty($proveedor->email)) {
            $infoAdicional = $xml->addChild('infoAdicional');
            $campo = $infoAdicional->addChild('campoAdicional', $this->esc($proveedor->email));
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
