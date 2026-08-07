const MARCADORES_SIMPLES = {
    enviarCardapio: '[[ENVIAR_CARDAPIO]]',
    enviarLocalizacao: '[[ENVIAR_LOCALIZACAO]]',
    chamarAtendente: '[[CHAMAR_ATENDENTE]]',
    pedidoDelivery: '[[PEDIDO_DELIVERY]]',
    oferecerConfirmacaoEquipe: '[[OFERECER_CONFIRMACAO_EQUIPE]]',
    confirmarComEquipe: '[[CONFIRMAR_COM_EQUIPE]]'
};

const REGEX_RESERVA = /\[\[RESERVA_COMPLETA\]\]([\s\S]*?)\[\[\/RESERVA_COMPLETA\]\]/i;
const REGEX_RESERVA_GLOBAL = /\[\[RESERVA_COMPLETA\]\]([\s\S]*?)\[\[\/RESERVA_COMPLETA\]\]/gi;
const REGEX_MARCADOR_INTERNO = /\[\[\/?[A-Z][A-Z0-9_-]*\]\]/gi;

function extrairCamposReserva(bloco = '') {
    const campos = {};

    for (const linha of String(bloco).split('\n')) {
        const match = linha.match(/^\s*(Nome|Data|Horário|Horario|Quantidade de pessoas|Ambiente|Pet|Observações|Observacoes)\s*:\s*(.+?)\s*$/i);

        if (!match) continue;

        const chave = match[1]
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        campos[chave] = match[2].trim();
    }

    return campos;
}

function reservaTemDadosMinimos(bloco) {
    const campos = extrairCamposReserva(bloco);

    const obrigatorios = [
        'nome',
        'data',
        'horario',
        'quantidade de pessoas',
        'ambiente'
    ];

    return obrigatorios.every(chave => {
        const valor = campos[chave];
        return valor && valor !== '...' && !/^não informado$/i.test(valor);
    });
}

function interpretarRespostaAna(respostaOriginal) {
    const resposta = typeof respostaOriginal === 'string'
        ? respostaOriginal
        : '';
    const respostaNormalizada = resposta.toUpperCase();

    const reservaMatch = resposta.match(REGEX_RESERVA);
    const blocoReserva = reservaMatch ? reservaMatch[1].trim() : null;
    const reservaValida = Boolean(blocoReserva && reservaTemDadosMinimos(blocoReserva));

    const acoes = {
        enviarCardapio: respostaNormalizada.includes(MARCADORES_SIMPLES.enviarCardapio),
        enviarLocalizacao: respostaNormalizada.includes(MARCADORES_SIMPLES.enviarLocalizacao),
        chamarAtendente: respostaNormalizada.includes(MARCADORES_SIMPLES.chamarAtendente),
        pedidoDelivery: respostaNormalizada.includes(MARCADORES_SIMPLES.pedidoDelivery),
        oferecerConfirmacaoEquipe: respostaNormalizada.includes(MARCADORES_SIMPLES.oferecerConfirmacaoEquipe),
        confirmarComEquipe: respostaNormalizada.includes(MARCADORES_SIMPLES.confirmarComEquipe),
        reservaCompleta: reservaValida,
        dadosReserva: reservaValida ? blocoReserva : null
    };

    const textoCliente = resposta
        .replace(REGEX_RESERVA_GLOBAL, '')
        .replace(REGEX_MARCADOR_INTERNO, '')
        .trim();

    return {
        textoCliente,
        acoes
    };
}

module.exports = {
    extrairCamposReserva,
    interpretarRespostaAna,
    reservaTemDadosMinimos
};
