<?php
[$script, $xmlPath, $xsdPath] = $argv + [null, null, null];

if (! $xmlPath || ! $xsdPath) {
    exit("Uso: php validar_xml.php archivo.xml esquema.xsd\n");
}

libxml_use_internal_errors(true);

$dom = new DOMDocument();
if (! $dom->load($xmlPath)) {
    echo "El XML está mal formado:\n";
    foreach (libxml_get_errors() as $e) {
        echo "  Línea {$e->line}: " . trim($e->message) . "\n";
    }
    exit(1);
}

if ($dom->schemaValidate($xsdPath)) {
    echo "OK: el XML es válido contra el XSD\n";
} else {
    echo "El XML NO cumple el XSD:\n";
    foreach (libxml_get_errors() as $e) {
        echo "  Línea {$e->line}: " . trim($e->message) . "\n";
    }
    exit(1);
}
