const {
    detectarDiaSemanaMencionado
} = require('./contextoDataBrasil');

const PADRAO_DIA_SEMANA =
    '(?:segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|' +
    'quinta(?:-feira)?|sexta(?:-feira)?|sabado|domingo)';

const ORDINAIS = Object.freeze({
    primeiro: 1,
    primeira: 1,
    segundo: 2,
    segunda: 2,
    terceiro: 3,
    terceira: 3,
    quarto: 4,
    quarta: 4,
    quinto: 5,
    quinta: 5
});

function normalizarTexto(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function possuiDataCivilExplicita(mensagem) {
    return (
        /\b\d{1,2}\s*[\/.\-]\s*\d{1,2}(?:\s*[\/.\-]\s*\d{2,4})?\b/.test(mensagem) ||
        /\b(?:hoje|amanha|depois de amanha)\b/.test(mensagem) ||
        /\bdia\s+\d{1,2}\b/.test(mensagem)
    );
}

function detectarOrdinal(mensagem, possuiDiaAnterior) {
    const ordinalComDia = mensagem.match(
        new RegExp(
            `\\b(primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa])\\s+${PADRAO_DIA_SEMANA}\\b`
        )
    );

    if (ordinalComDia) {
        return ORDINAIS[ordinalComDia[1]] || null;
    }

    if (!possuiDiaAnterior) return null;

    const ordinalDaOcorrencia = mensagem.match(
        /\b(primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa])\s+ocorrencia\b/
    );

    return ordinalDaOcorrencia
        ? (ORDINAIS[ordinalDaOcorrencia[1]] || null)
        : null;
}

function detectarComandoDataRelativa(
    texto = '',
    { diaSemanaAnterior = null } = {}
) {
    const mensagem = normalizarTexto(texto);

    if (!mensagem || possuiDataCivilExplicita(mensagem)) return null;

    const diaSemanaMencionado = detectarDiaSemanaMencionado(mensagem);
    const diaSemana = diaSemanaMencionado || diaSemanaAnterior;

    if (!diaSemana) return null;

    const ordinal = detectarOrdinal(mensagem, Boolean(diaSemanaAnterior));

    if (ordinal) {
        return {
            tipo: 'selecionar-ocorrencia',
            modo: 'ordinal',
            ocorrenciaAlvo: ordinal,
            diaSemana,
            diaSemanaMencionado: Boolean(diaSemanaMencionado)
        };
    }

    const voltarParaPrimeira = (
        new RegExp(
            `\\b(?:ess[ea]|ness[ea]|nest[ea])\\s+${PADRAO_DIA_SEMANA}\\s+mesm[oa]\\b`
        ).test(mensagem) ||
        /\b(?:volta|voltar|retorna|retornar|quero)\b.{0,50}\bprimeir[oa]\b/.test(mensagem) ||
        /\b(?:fica|pode ser)\b.{0,30}\bprimeir[oa]\b/.test(mensagem)
    );

    if (voltarParaPrimeira) {
        return {
            tipo: 'selecionar-ocorrencia',
            modo: 'voltar-primeira',
            ocorrenciaAlvo: 1,
            diaSemana,
            diaSemanaMencionado: Boolean(diaSemanaMencionado)
        };
    }

    const avancarUmaOcorrencia = (
        /\bmais\s+um(?:a)?\b.{0,50}\bdepois\b/.test(mensagem) ||
        /\bdepois\s+(?:dess[ea]|dest[ea]|daquel[ea])\b/.test(mensagem) ||
        new RegExp(
            `\\b${PADRAO_DIA_SEMANA}\\s+depois\\s+(?:dess[ea]|dest[ea]|daquel[ea])\\b`
        ).test(mensagem)
    );

    if (avancarUmaOcorrencia) {
        return {
            tipo: 'avancar-ocorrencia',
            modo: 'avancar-explicito',
            diaSemana,
            diaSemanaMencionado: Boolean(diaSemanaMencionado)
        };
    }

    const selecionarSegunda = (
        new RegExp(
            `(?:\\boutr[oa]\\s+${PADRAO_DIA_SEMANA}\\b|` +
            `\\b${PADRAO_DIA_SEMANA}\\s+(?:seguinte|da\\s+outra\\s+semana)\\b)`
        ).test(mensagem) ||
        /\bsem\s+ser\b.{0,80}\b(?:outr[oa]|proxim[oa])\b/.test(mensagem) ||
        /^(?:no|na|o|a)?\s*outr[oa](?:\s+mesm[oa])?$/.test(mensagem)
    );

    if (selecionarSegunda) {
        return {
            tipo: 'selecionar-ocorrencia',
            modo: 'segunda-idempotente',
            ocorrenciaAlvo: 2,
            diaSemana,
            diaSemanaMencionado: Boolean(diaSemanaMencionado)
        };
    }

    return null;
}

module.exports = {
    detectarComandoDataRelativa,
    normalizarTexto
};
