function normalizarTexto(texto = '') {
    return String(texto)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

const PADROES_ADMINISTRATIVOS = [
    /\b(sou|somos)\s+(fornecedor|representante|distribuidor)\b/,
    /\bfornecedor(?:a|es)?\b/,
    /\brepresentante\s+comercial\b/,
    /\bdistribuidor(?:a|es)?\b/,
    /\bnota\s+fiscal\b/,
    /\bdanfe\b/,
    /\barquivo\s+xml\b/,
    /\bboleto\s+(vencido|pendente|para\s+pagamento|da\s+empresa)\b/,
    /\bcobranca\s+(pendente|da\s+empresa|em\s+aberto)\b/,
    /\bfinanceiro\s+(da\s+empresa|do\s+restaurante|sobre\s+pagamento)\b/,
    /\bcertificado\s+digital\b/,
    /\bsenha\s+(de\s+acesso|do\s+sistema|do\s+certificado)\b/,
    /\b(entrega|retirada)\s+de\s+mercadoria\b/,
    /\b(vender|fornecer)\s+(para|pra)\s+(voces|o\s+restaurante)\b/,
    /\bposso\s+mandar\s+(a\s+)?tabela\b/,
    /\btabela\s+de\s+precos?\s+(para|pra)\s+voces\b/,
    /\bpromocao\s+de\s+(carne|frango|bebida|cerveja|vinho)\b/
];

function classificarMensagem2Vales(textoOriginal = '') {
    const texto = normalizarTexto(textoOriginal);
    const administrativo = PADROES_ADMINISTRATIVOS.some(regex => regex.test(texto));

    return {
        tipo: administrativo ? 'ADMINISTRATIVO' : 'CLIENTE',
        bloquearResposta: administrativo,
        motivo: administrativo
            ? 'Mensagem com sinais claros de fornecedor ou assunto administrativo.'
            : 'Mensagem comum de cliente.'
    };
}

module.exports = {
    classificarMensagem2Vales,
    normalizarTexto
};
