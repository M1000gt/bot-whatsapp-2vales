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

function valorEhInformado(valor) {
    return Boolean(
        valor &&
        !/^(?:não|nao)\s+(?:informad[oa]|identificad[oa])$/i.test(String(valor).trim()) &&
        String(valor).trim() !== '...'
    );
}

function extrairCamposRotulados(texto = '') {
    const dados = {};
    const mapa = {
        nome: 'nome',
        localidade: 'localidade',
        endereco: 'localidade',
        'localidade/endereco': 'localidade',
        pedido: 'pedido',
        prato: 'pedido',
        acompanhamento: 'acompanhamento',
        quantidade: 'quantidade',
        observacoes: 'observacoes'
    };

    for (const linha of String(texto).split('\n')) {
        const match = linha.match(/^\s*([^:]{2,30})\s*:\s*(.+?)\s*$/);
        if (!match) continue;

        const rotulo = normalizarTexto(match[1]);
        const chave = mapa[rotulo];
        if (chave) dados[chave] = match[2].trim();
    }

    return dados;
}

function extrairDadosPedidoDeliveryDaMensagem(texto = '') {
    const original = String(texto || '').replace(/\s+/g, ' ').trim();
    const rotulados = extrairCamposRotulados(texto);

    if (Object.keys(rotulados).length >= 2) return rotulados;

    const itemMatch = original.match(/\b(fil[eé]t?|filet|framboises?|naranjita|moskova|poivre|pesto|lapin|coq|canard|truite|namorado|risoto|massa|rigatoni|farfalle|ragu|paillard|shimeji|fondue|raclette|sopa|carpaccio|burrata|salada|ossobuco|polpetone|surpresa de bombom|bombom de alcatra|sobremesa)\b/i);

    if (!itemMatch || itemMatch.index === undefined) return rotulados;

    let prefixo = original.slice(0, itemMatch.index).trim().replace(/[,;-]+$/, '').trim();
    let pedido = original.slice(itemMatch.index).trim();
    const dados = { ...rotulados };
    const quantidadeNoPrefixo = prefixo.match(/\b(\d+|um|uma|dois|duas|tres|três|quatro|cinco)\s*$/i);

    if (quantidadeNoPrefixo && quantidadeNoPrefixo.index !== undefined) {
        const antesDaQuantidade = prefixo.slice(0, quantidadeNoPrefixo.index).trim();

        if (!/\b(?:s[ií]tio|casa|apartamento|apto|n[uú]mero|n[º°])\s*$/i.test(antesDaQuantidade)) {
            dados.quantidade = quantidadeNoPrefixo[1];
            prefixo = antesDaQuantidade;
        }
    }

    const localidadeMatch = prefixo.match(/\b(vale\s+(?:da\s+boa\s+esperan[cç]a|do\s+cuiab[aá])|itaipava|santo\s+ant[oô]nio|boa\s+esperan[cç]a|blue\s+bear|rua|estrada|s[ií]tio|pousada|condom[ií]nio|casa|apartamento|apto)\b/i);

    if (localidadeMatch && localidadeMatch.index !== undefined) {
        dados.nome = prefixo.slice(0, localidadeMatch.index).trim();
        dados.localidade = prefixo.slice(localidadeMatch.index).trim();
    }

    const acompanhamentoMatch = pedido.match(/\b(?:com|c\/)\s+((?:batatas?\s+)?(?:roestie?|rosti)|cenourinhas?\s+carameladas?|cebolinhas?\s+caramelizadas?|alho-por[oó]\s+gratinado|risotinho\s+de\s+alho-por[oó]|batata\s+bolinha\s+saut[eé]|arroz(?:\s+(?:branco|de\s+passas|de\s+am[eê]ndoas))?|pur[eê])\b/i);

    if (acompanhamentoMatch) {
        dados.acompanhamento = acompanhamentoMatch[1].trim();
        pedido = `${pedido.slice(0, acompanhamentoMatch.index)} ${pedido.slice(
            acompanhamentoMatch.index + acompanhamentoMatch[0].length
        )}`.replace(/\s+/g, ' ').trim();
    }

    dados.pedido = pedido;
    return dados;
}

function consolidarDadosPedidoDelivery(dadosEstruturados, textoCliente = '') {
    const fallback = extrairDadosPedidoDeliveryDaMensagem(textoCliente);
    const estruturados = dadosEstruturados && typeof dadosEstruturados === 'object'
        ? dadosEstruturados
        : {};
    const campos = [
        'nome',
        'localidade',
        'pedido',
        'acompanhamento',
        'quantidade',
        'observacoes'
    ];
    const resultado = {};

    for (const campo of campos) {
        if (valorEhInformado(estruturados[campo])) {
            resultado[campo] = String(estruturados[campo]).trim();
        } else if (valorEhInformado(fallback[campo])) {
            resultado[campo] = String(fallback[campo]).trim();
        }
    }

    return resultado;
}

module.exports = {
    consolidarDadosPedidoDelivery,
    criarRespostaInicioPedidoDelivery,
    criarRespostaRecebimentoPedidoDelivery,
    deveSolicitarDadosIniciaisDelivery,
    extrairDadosPedidoDeliveryDaMensagem,
    mensagemPareceDadosDePedido,
    mensagemSolicitaInicioPedidoDelivery,
    normalizarTexto,
    textoTemDetalhesDePedido,
    textoTemItemDePedido
};
