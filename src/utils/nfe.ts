export interface NfeItem {
    nItem: string;
    supplierCode: string;
    barcode?: string;
    name: string;
    quantity: number;
    unitCost: number;
}

export interface ParsedNfe {
    emitCnpj?: string;
    emitName?: string;
    items: NfeItem[];
}

function tag(block: string, name: string): string | undefined {
    return block.match(new RegExp(`<${name}>(.*?)</${name}>`))?.[1];
}

export function parseNfe(xml: string): ParsedNfe {
    const emitBlock = xml.match(/<emit>(.*?)<\/emit>/)?.[1] ?? '';
    const emitCnpj = tag(emitBlock, 'CNPJ');
    const emitName = tag(emitBlock, 'xNome');

    const items: NfeItem[] = [];
    for (const m of xml.matchAll(/<det nItem="(\d+)"><prod>(.*?)<\/prod>/g)) {
        const prod = m[2];
        const ean = tag(prod, 'cEAN');
        items.push({
            nItem: m[1],
            supplierCode: tag(prod, 'cProd') ?? '',
            barcode: ean && ean !== 'SEM GTIN' ? ean : undefined,
            name: tag(prod, 'xProd') ?? '',
            quantity: Math.round(parseFloat(tag(prod, 'qCom') ?? '0')),
            unitCost: parseFloat(tag(prod, 'vUnCom') ?? '0'),
        });
    }

    return { emitCnpj, emitName, items };
}
