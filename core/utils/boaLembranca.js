function normalizarTexto(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function identificarPratoBoaLembranca(texto = '') {
    const mensagem = normalizarTexto(texto);

    if (/\b(?:surpresa de bombom|bombom de alcatra)\b/.test(mensagem)) {
        return 'Surpresa de Bombom';
    }

    if (/\bpolpetone(?: de file mignon)?\b/.test(mensagem)) {
        return 'Polpetone de Filé Mignon';
    }

    if (/\bossobuco(?: de vitelo)?\b/.test(mensagem)) {
        return 'Ossobuco de Vitelo';
    }

    if (/\bboa lembranca\b/.test(mensagem)) {
        return 'prato da Boa Lembrança';
    }

    return null;
}

function mensagemPedeDelivery(texto = '') {
    const mensagem = normalizarTexto(texto);

    return /\b(?:delivery|entrega|entregar|entregam|entrega-se|enviar|enviam|envia|para entrega|pra entrega|pedido para entrega|pedido pra entrega|mandar entregar)\b/.test(mensagem);
}

function analisarDeliveryBoaLembranca(texto = '') {
    const prato = identificarPratoBoaLembranca(texto);

    return {
        bloquear: Boolean(prato && mensagemPedeDelivery(texto)),
        prato
    };
}

function criarRespostaBloqueioDeliveryBoaLembranca(prato) {
    const nome = prato && prato !== 'prato da Boa Lembrança'
        ? `O ${prato}`
        : 'Os pratos da Boa Lembrança';

    return `${nome} é exclusivo para consumo no restaurante e não está disponível para delivery. Para delivery, posso ajudar com outras opções do cardápio.`;
}

module.exports = {
    analisarDeliveryBoaLembranca,
    criarRespostaBloqueioDeliveryBoaLembranca,
    identificarPratoBoaLembranca,
    mensagemPedeDelivery,
    normalizarTexto
};
