const ESPECIALIDADES = Object.freeze({
    raclette: {
        nome: 'Raclette du Valais',
        preco: 'R$ 209,00'
    },
    chinoise: {
        nome: 'Fondue chinoise de mignon',
        preco: 'R$ 239,00'
    },
    queijo: {
        nome: 'Fondue de queijo',
        preco: 'R$ 209,00'
    }
});

function normalizarTexto(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function mensagemPerguntaPrecoOuRendimento(texto = '') {
    const mensagem = normalizarTexto(texto);

    return /\b(?:preco|valor|quanto\s+custa|custa\s+quanto|serve\s+quant|quantas?\s+pessoas?|por\s+pessoa|por\s+casal|para\s+duas|2\s+pessoas|individual|rendimento)\b/.test(
        mensagem
    );
}

function detectarEspecialidadesMencionadas(texto = '') {
    const mensagem = normalizarTexto(texto);
    const mencionaRaclette = /\braclet+e?\b/.test(mensagem);
    const mencionaFondue = /\bfondue?s?\b/.test(mensagem);
    const mencionaQueijo = mencionaFondue && /\bqueijo\b/.test(mensagem);
    const mencionaChinoise = mencionaFondue && /\b(?:chinoise|mignon)\b/.test(mensagem);
    const itens = [];

    if (mencionaRaclette) itens.push('raclette');

    if (mencionaFondue) {
        if (mencionaQueijo) itens.push('queijo');
        if (mencionaChinoise) itens.push('chinoise');

        if (!mencionaQueijo && !mencionaChinoise) {
            itens.push('chinoise', 'queijo');
        }
    }

    return [...new Set(itens)];
}

function criarRespostaPrecoEspecialidadesInverno(texto = '') {
    if (!mensagemPerguntaPrecoOuRendimento(texto)) return null;

    const itens = detectarEspecialidadesMencionadas(texto);

    if (itens.length === 0) return null;

    if (itens.length === 1) {
        const item = ESPECIALIDADES[itens[0]];

        return `${item.nome} serve duas pessoas. O valor de ${item.preco} é pelo prato completo para a dupla ou casal, e não por pessoa.`;
    }

    const linhas = itens.map(chave => {
        const item = ESPECIALIDADES[chave];
        return `- ${item.nome}: ${item.preco}, serve duas pessoas`;
    });

    return `Os valores das especialidades abaixo são pelo prato completo para duas pessoas, e não por pessoa:\n\n${linhas.join('\n')}`;
}

module.exports = {
    criarRespostaPrecoEspecialidadesInverno,
    detectarEspecialidadesMencionadas,
    mensagemPerguntaPrecoOuRendimento
};

