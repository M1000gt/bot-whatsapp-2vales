const { extrairCamposReserva } = require('./acoesAna');

function normalizarValor(valor = '') {
    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function criarImpressaoReserva(dadosReserva) {
    const campos = extrairCamposReserva(dadosReserva);
    const ordem = [
        'nome',
        'data',
        'horario',
        'quantidade de pessoas',
        'ambiente',
        'pet',
        'observacoes'
    ];

    return ordem
        .map(chave => `${chave}:${normalizarValor(campos[chave])}`)
        .join('|');
}

function mensagemEhCortesiaAposReserva(texto = '') {
    const mensagem = normalizarValor(texto);

    return /^(?:perfeito|obrigado|obrigada|muito obrigado|muito obrigada|valeu|beleza|ok|okay|certo|tudo certo|show)$/.test(mensagem);
}

function criarRespostaSeguraReserva(dadosReserva, tipo = 'nova') {
    let introducao = 'Perfeito. Considerei os dados abaixo:';
    let encaminhamento = 'Sua solicitação foi encaminhada para a equipe verificar a disponibilidade.';

    if (tipo === 'atualizacao') {
        introducao = 'Perfeito. Atualizei os dados da sua solicitação:';
        encaminhamento = 'A correção foi encaminhada para a equipe responsável.';
    } else if (tipo === 'duplicada') {
        introducao = 'Perfeito. Estes são os dados mais recentes da sua solicitação:';
        encaminhamento = 'Esses dados já estavam registrados, então não enviei uma solicitação duplicada.';
    }

    return `${introducao}\n\n${dadosReserva}\n\n${encaminhamento}\nA reserva ainda depende da confirmação de disponibilidade pela equipe no WhatsApp.`;
}

function criarRespostaCortesiaReserva() {
    return 'Por nada! A solicitação foi encaminhada, mas a reserva ainda depende da confirmação de disponibilidade pela equipe no WhatsApp. 😊';
}

function criarControleEncaminhamentoReserva({ expiracaoMs = 2 * 60 * 60 * 1000 } = {}) {
    const reservas = new Map();

    function obterRegistro(chave, agora) {
        const registro = reservas.get(chave);

        if (!registro) return null;

        if (agora - registro.atualizadoEm > expiracaoMs) {
            reservas.delete(chave);
            return null;
        }

        return registro;
    }

    function registrar(chave, dadosReserva, agora = Date.now()) {
        const impressao = criarImpressaoReserva(dadosReserva);
        const anterior = obterRegistro(chave, agora);
        let tipo = 'nova';

        if (anterior) {
            tipo = anterior.impressao === impressao
                ? 'duplicada'
                : 'atualizacao';
        }

        reservas.set(chave, {
            dadosReserva,
            impressao,
            atualizadoEm: agora
        });

        return {
            tipo,
            dadosReserva,
            dadosAnteriores: anterior ? anterior.dadosReserva : null
        };
    }

    function obterReservaRecente(chave, agora = Date.now()) {
        const registro = obterRegistro(chave, agora);
        return registro ? registro.dadosReserva : null;
    }

    return {
        obterReservaRecente,
        registrar
    };
}

module.exports = {
    criarControleEncaminhamentoReserva,
    criarImpressaoReserva,
    criarRespostaCortesiaReserva,
    criarRespostaSeguraReserva,
    mensagemEhCortesiaAposReserva
};
