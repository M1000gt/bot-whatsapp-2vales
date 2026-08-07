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

    return /^(?:sim|sim por favor|sim pode|sim pode confirmar|sim confirma|pode|pode sim|pode confirmar|confirma por favor|por favor|quero sim|gostaria sim|claro|ok pode confirmar)$/.test(mensagem);
}

function mensagemRecusaConfirmacao(texto = '') {
    const mensagem = normalizarMensagem(texto);

    return /^(?:nao|nao obrigado|nao obrigada|deixa|deixa pra la|deixa para la|nao precisa|obrigado nao|obrigada nao)$/.test(mensagem);
}

function mensagemPedeConfirmacaoDireta(texto = '') {
    const mensagem = normalizarMensagem(texto);

    return /\b(?:pode|consegue|poderia|gostaria de|quero que)\b.{0,35}\b(?:confirmar|consultar|verificar|perguntar)\b/.test(mensagem) ||
        /\b(?:confirma|confirme|consulte|verifique|pergunte)\b.{0,35}\b(?:equipe|pessoal|responsavel)\b/.test(mensagem);
}

function respostaOfereceConfirmacao(texto = '') {
    const mensagem = normalizarMensagem(texto);

    return /nao tenho.{0,50}informacao confirmada/.test(mensagem) ||
        /(?:posso|se desejar).{0,70}(?:equipe|pessoal).{0,40}(?:confirm|consult|verific)/.test(mensagem) ||
        /(?:vou|irei) encaminhar.{0,60}(?:equipe|responsavel)/.test(mensagem);
}

function criarRespostaOfertaConfirmacao() {
    return 'Não tenho essa informação confirmada no meu material no momento. Se desejar, posso pedir à equipe que confirme para o senhor.';
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

    function limpar(chave) {
        pendencias.delete(chave);
    }

    return {
        interpretarResposta,
        limpar,
        registrarOferta
    };
}

module.exports = {
    criarRespostaOfertaConfirmacao,
    criarControleConfirmacaoEquipe,
    mensagemAceitaConfirmacao,
    mensagemPedeConfirmacaoDireta,
    mensagemRecusaConfirmacao,
    normalizarMensagem,
    respostaOfereceConfirmacao
};
