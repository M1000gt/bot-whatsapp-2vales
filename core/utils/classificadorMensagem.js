function normalizarTexto(texto = '') {
    return String(texto)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function escaparRegex(texto = '') {
    return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function criarPadraoTermo(termo = '') {
    const palavras = normalizarTexto(termo)
        .split(' ')
        .filter(Boolean)
        .map(escaparRegex);

    return new RegExp(`\\b${palavras.join('\\s+')}\\b`);
}

function contemAlguma(texto, termos) {
    return termos.some(termo => criarPadraoTermo(termo).test(texto));
}

function classificarMensagem(textoOriginal = '') {
    const texto = normalizarTexto(textoOriginal);

    const termosFornecedor = [
        'fornecedor',
        'fornecemos',
        'representante',
        'distribuidora',
        'distribuidor',
        'atacado',
        'vender para voces',
        'vender pra voces',
        'tenho promocao',
        'promocao de carne',
        'promocao de frango',
        'promocao de peixe',
        'tabela de preco',
        'tabela de precos',
        'posso mandar tabela',
        'cotacao',
        'orcamento para voces',
        'entrega de produtos',
        'pedido para essa semana'
    ];

    const termosAdministrativos = [
        'nota fiscal',
        'boleto',
        'cobranca',
        'pagamento pendente',
        'financeiro',
        'nf',
        'cnpj',
        'danfe',
        'xml',
        'contador',
        'contabilidade'
    ];

    if (contemAlguma(texto, termosFornecedor)) {
        return {
            tipo: 'FORNECEDOR',
            bloquearResposta: true,
            motivo: 'Mensagem parece ser de fornecedor, vendedor ou representante comercial.'
        };
    }

    if (contemAlguma(texto, termosAdministrativos)) {
        return {
            tipo: 'ADMINISTRATIVO',
            bloquearResposta: true,
            motivo: 'Mensagem parece ser administrativa, financeira ou interna.'
        };
    }

    return {
        tipo: 'CLIENTE',
        bloquearResposta: false,
        motivo: 'Mensagem comum de cliente.'
    };
}

module.exports = {
    classificarMensagem
};
