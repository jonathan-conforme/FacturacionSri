<?php

namespace App\Services\Xml;

use App\Models\GuiaRemision;
use Carbon\Carbon;
use SimpleXMLElement;

class XmlGuiaRemisionBuilder
{
    public function generarXml(GuiaRemision $guia): string
    {
        $guia->load(['emisor', 'cliente', 'detalles']);
        $emisor = $guia->emisor;
        $cliente = $guia->cliente;

        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><guiaRemision id="comprobante" version="1.1.0"></guiaRemision>');

        // 1. infoTributaria
        $tributaria = $xml->addChild('infoTributaria');
        $tributaria->addChild('ambiente', $emisor->ambiente);
        $tributaria->addChild('tipoEmision', '1');
        $tributaria->addChild('razonSocial', $this->esc($emisor->razon_social));

        if (! empty($emisor->nombre_comercial)) {
            $tributaria->addChild('nombreComercial', $this->esc($emisor->nombre_comercial));
        }

        $tributaria->addChild('ruc', $emisor->ruc);
        $tributaria->addChild('claveAcceso', $guia->clave_acceso);
        $tributaria->addChild('codDoc', '06'); // 06: Guía de Remisión
        $tributaria->addChild('estab', str_pad($guia->establecimiento, 3, '0', STR_PAD_LEFT));
        $tributaria->addChild('ptoEmi', str_pad($guia->punto_emision, 3, '0', STR_PAD_LEFT));
        $tributaria->addChild('secuencial', str_pad($guia->secuencial, 9, '0', STR_PAD_LEFT));
        $tributaria->addChild('dirMatriz', $this->esc($emisor->dir_matriz));

        // 2. infoGuiaRemision
        $info = $xml->addChild('infoGuiaRemision');
        if (! empty($emisor->dir_establecimiento)) {
            $info->addChild('dirEstablecimiento', $this->esc($emisor->dir_establecimiento));
        }
        $info->addChild('dirPartida', $this->esc($guia->dir_partida));
        $info->addChild('razonSocialTransportista', $this->esc($guia->razon_social_transportista));
        $info->addChild('tipoIdentificacionTransportista', $guia->tipo_identificacion_transportista);
        $info->addChild('rucTransportista', $guia->identificacion_transportista);
        $info->addChild('obligadoContabilidad', strtoupper($emisor->obligado_contabilidad) === 'SI' ? 'SI' : 'NO');

        if (! empty($emisor->contribuyente_especial)) {
            $info->addChild('contribuyenteEspecial', $emisor->contribuyente_especial);
        }

        $info->addChild('fechaIniTransporte', Carbon::parse($guia->fecha_inicio_transporte)->format('d/m/Y'));
        $info->addChild('fechaFinTransporte', Carbon::parse($guia->fecha_fin_transporte)->format('d/m/Y'));
        $info->addChild('placa', $this->esc($guia->placa));

        // 3. destinatarios
        $destinatarios = $xml->addChild('destinatarios');
        $destinatario = $destinatarios->addChild('destinatario');
        $destinatario->addChild('identificacionDestinatario', $cliente->identificacion);
        $destinatario->addChild('razonSocialDestinatario', $this->esc($cliente->razon_social));
        $destinatario->addChild('dirDestinatario', $this->esc($guia->dir_destinatario));
        $destinatario->addChild('motivoTraslado', $this->esc($guia->motivo_traslado));

        if (! empty($guia->ruta)) {
            $destinatario->addChild('ruta', $this->esc($guia->ruta));
        }

        if (! empty($guia->num_doc_sustento)) {
            $destinatario->addChild('codDocSustento', $guia->cod_doc_sustento ?? '01');
            $destinatario->addChild('numDocSustento', $guia->num_doc_sustento);
            if (! empty($guia->num_aut_doc_sustento)) {
                $destinatario->addChild('numAutDocSustento', $guia->num_aut_doc_sustento);
            }
            if (! empty($guia->fecha_emision_doc_sustento)) {
                $destinatario->addChild('fechaEmisionDocSustento', Carbon::parse($guia->fecha_emision_doc_sustento)->format('d/m/Y'));
            }
        }

        // Detalles de artículos trasladados
        $detalles = $destinatario->addChild('detalles');
        foreach ($guia->detalles as $det) {
            $detalle = $detalles->addChild('detalle');
            $detalle->addChild('codigoInterno', $this->esc($det->codigo_interno));
            if (! empty($det->codigo_adicional)) {
                $detalle->addChild('codigoAdicional', $this->esc($det->codigo_adicional));
            }
            $detalle->addChild('descripcion', $this->esc($det->descripcion));
            $detalle->addChild('cantidad', number_format((float) $det->cantidad, 6, '.', ''));
        }

        // 4. infoAdicional
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
}