function normalizarTexto(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function textoTemItemDePedido(texto = '') {
    const mensagem = normalizarTexto(texto);

    return /\b(?:file|filet|framboises|naranjita|roesti|batata|arroz|pure|puree|massa|prato|acompanhamento|ossobuco|polpetone|surpresa de bombom|bombom de alcatra|salmao|peixe|carne|frango|sobremesa)\b/.test(mensagem);
}

function textoTemDetalhesDePedido(texto = '') {
    const mensagem = normalizarTexto(texto);

    return /\b\d+\b/.test(mensagem) ||
        /\b(?:um|uma|dois|duas|tres|quatro|cinco|quantidade)\b/.test(mensagem) ||
        /\b(?:ao ponto|mal passado|bem passado|dividido|dividida|com|c\/|sem|acompanhamento|endereco|localidade|rua|estrada|sitio|vale)\b/.test(mensagem);
}

function mensagemPareceDadosDePedido(texto = '') {
    return textoTemItemDePedido(texto) && textoTemDetalhesDePedido(texto);
}

function mensagemSolicitaInicioPedidoDelivery(texto = '') {
    const mensagem = normalizarTexto(texto);
    const mencionaEntrega =
        /\bdelivery\b/.test(mensagem) ||
        /\b(?:para|pra)\s+(?:a\s+)?entrega\b/.test(mensagem) ||
        /\bpedido\s+(?:de|para|pra)\s+entrega\b/.test(mensagem) ||
        /\bentregar\b/.test(mensagem);

    if (!mencionaEntrega) return false;

    return /\b(?:quero|gostaria|desejo|preciso)\s+(?:de\s+)?(?:fazer|realizar|iniciar|montar)\s+(?:um\s+)?pedido\b/.test(mensagem) ||
        /\b(?:quero|gostaria|desejo|preciso)\s+(?:de\s+)?(?:pedir|comprar)\b/.test(mensagem) ||
        /\b(?:vou|vamos)\s+(?:fazer|iniciar|montar)\s+(?:um\s+)?pedido\b/.test(mensagem);
}

function deveSolicitarDadosIniciaisDelivery(texto = '') {
    return mensagemSolicitaInicioPedidoDelivery(texto) &&
        !mensagemPareceDadosDePedido(texto);
}

function criarRespostaInicioPedidoDelivery() {
    return 'Claro! Para encaminhar seu pedido de delivery, envie, por favor: nome, localidade/endereço, prato desejado, acompanhamento, quantidade e alguma observação, se houver. A equipe confirmará a disponibilidade, a área atendida, a taxa, o prazo e a forma de pagamento antes de finalizar o pedido.';
}

function criarRespostaRecebimentoPedidoDelivery() {
    return 'Perfeito. Recebi os dados do seu pedido e encaminhei para a equipe responsável. Eles ainda confirmarão a disponibilidade do prato, o endereço e a área atendida, a taxa e o prazo de entrega, além da forma de pagamento. O pedido será finalizado somente depois dessa confirmação pelo WhatsApp.';
}

module.exports = {
    criarRespostaInicioPedidoDelivery,
    criarRespostaRecebimentoPedidoDelivery,
    deveSolicitarDadosIniciaisDelivery,
    mensagemPareceDadosDePedido,
    mensagemSolicitaInicioPedidoDelivery,
    normalizarTexto,
    textoTemDetalhesDePedido,
    textoTemItemDePedido
};
