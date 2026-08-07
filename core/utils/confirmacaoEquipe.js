function normalizarMensagem(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function mensagemAceitaConfirmacao(texto = '') {
    const mensagem = normalizarMensagem(texto);

    return /^(?:sim|sim por favor|pode|pode sim|pode confirmar|confirma por favor|por favor|quero sim|gostaria sim|claro|ok pode confirmar)$/.test(mensagem);
}

function mensagemRecusaConfirmacao(texto = '') {
    const mensagem = normalizarMensagem(texto);

    return /^(?:nao|nao obrigado|nao obrigada|deixa|deixa pra la|deixa para la|nao precisa|obrigado nao|obrigada nao)$/.test(mensagem);
}

function criarControleConfirmacaoEquipe({ expiracaoMs = 15 * 60 * 1000 } = {}) {
    const pendencias = new Map();

    function obter(chave, agora) {
        const pendencia = pendencias.get(chave);

        if (!pendencia) return null;

        if (agora - pendencia.criadaEm > expiracaoMs) {
            pendencias.delete(chave);
            return null;
        }

        return pendencia;
    }

    function registrarOferta(chave, perguntaOriginal, agora = Date.now()) {
        pendencias.set(chave, {
            perguntaOriginal: String(perguntaOriginal || '').trim(),
            criadaEm: agora
        });
    }

    function interpretarResposta(chave, texto, agora = Date.now()) {
        const pendencia = obter(chave, agora);

        if (!pendencia) return { tipo: 'nenhuma' };

        if (mensagemAceitaConfirmacao(texto)) {
            pendencias.delete(chave);
            return {
                tipo: 'confirmada',
                perguntaOriginal: pendencia.perguntaOriginal
            };
        }

        if (mensagemRecusaConfirmacao(texto)) {
            pendencias.delete(chave);
            return {
                tipo: 'recusada',
                perguntaOriginal: pendencia.perguntaOriginal
            };
        }

        return {
            tipo: 'pendente',
            perguntaOriginal: pendencia.perguntaOriginal
        };
    }

    return {
        interpretarResposta,
        registrarOferta
    };
}

module.exports = {
    criarControleConfirmacaoEquipe,
    mensagemAceitaConfirmacao,
    mensagemRecusaConfirmacao,
    normalizarMensagem
};
