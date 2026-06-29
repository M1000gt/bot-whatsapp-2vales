const { classificarMensagem } = require('../utils/classificadorMensagem');

async function processarMensagemCliente({ texto, contato = {}, responderComIA }) {
    const classificacao = classificarMensagem(texto);

    if (classificacao.bloquearResposta) {
        return {
            deveResponderCliente: false,
            tipo: classificacao.tipo,
            motivo: classificacao.motivo,
            respostaCliente: null,
            avisoInterno: montarAvisoInterno({
                tipo: classificacao.tipo,
                motivo: classificacao.motivo,
                texto,
                contato
            })
        };
    }

    if (typeof responderComIA !== 'function') {
        return {
            deveResponderCliente: false,
            tipo: 'ERRO',
            motivo: 'Função responderComIA não informada.',
            respostaCliente: null,
            avisoInterno: 'Erro interno: função responderComIA não foi informada.'
        };
    }

    const resposta = await responderComIA(texto, {
        nomeCliente: contato.nome || 'Cliente',
        historico: contato.historico || ''
    });

    return {
        deveResponderCliente: true,
        tipo: 'CLIENTE',
        motivo: 'Mensagem comum de cliente.',
        respostaCliente: resposta,
        avisoInterno: null
    };
}

function montarAvisoInterno({ tipo, motivo, texto, contato }) {
    const nome = contato.nome || 'Não identificado';
    const numero = contato.numero || 'Não informado';

    return `
🚨 MENSAGEM BLOQUEADA — ${tipo}

👤 Contato: ${nome}
📱 Número: ${numero}

Motivo:
${motivo}

Mensagem:
${texto}
`.trim();
}

module.exports = {
    processarMensagemCliente
};
