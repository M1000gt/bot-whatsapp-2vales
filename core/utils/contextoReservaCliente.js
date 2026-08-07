const { extrairCamposReserva } = require('./acoesAna');
const { obterProximaOcorrenciaDiaSemana } = require('./contextoDataBrasil');

function normalizarTexto(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function detectarIntencaoPet(texto = '') {
    const mensagem = normalizarTexto(texto);

    // A negação precisa ser verificada primeiro, pois "não tenho pet"
    // também contém literalmente o trecho "tenho pet".
    if (
        /\b(?:nao|n|ñ|neo|sem)\b.{0,30}\b(?:pet|pets|cachorro|cachorros|cao|caes|animal|animais)\b/.test(mensagem) ||
        /\b(?:nao|n|ñ|neo)\s+(?:vou|iremos|pretendo)\b.{0,25}\b(?:levar|com)\b.{0,20}\b(?:pet|cachorro|cao|animal)\b/.test(mensagem)
    ) {
        return false;
    }

    if (
        /\b(?:tenho|temos|teremos|levarei|levaremos|levo|levamos|com)\b.{0,25}\b(?:pet|pets|cachorro|cachorros|cao|caes|animal|animais)\b/.test(mensagem) ||
        /\b(?:vou|vamos|iremos)\b.{0,20}\blevar\b.{0,20}\b(?:pet|cachorro|cao|animal)\b/.test(mensagem)
    ) {
        return true;
    }

    return null;
}

function detectarAmbiente(texto = '') {
    const mensagem = normalizarTexto(texto);

    if (/\b(?:sala vip|sala reservada|ambiente reservado)\b/.test(mensagem)) {
        return 'Sala VIP';
    }

    if (/\b(?:ambiente\s+)?(?:externo|externa|area externa)\b/.test(mensagem)) {
        return 'Externo';
    }

    if (/\b(?:ambiente\s+)?(?:interno|interna|area interna)\b/.test(mensagem)) {
        return 'Interno';
    }

    return null;
}

function detectarDataPorDiaSemana(texto = '', dataBase = new Date()) {
    const mensagem = normalizarTexto(texto);
    const correspondencia = mensagem.match(
        /\b(segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado|domingo)\b/
    );

    if (!correspondencia) return null;

    const diaInformado = correspondencia[1];
    const estritamenteFutura = new RegExp(
        `(?:proxim[oa]\\s+${diaInformado}|${diaInformado}\\s+que\\s+vem)`,
        'i'
    ).test(mensagem);
    const ocorrencia = obterProximaOcorrenciaDiaSemana(
        diaInformado,
        dataBase,
        { estritamenteFutura }
    );

    if (!ocorrencia) return null;

    return `${ocorrencia.data} (${ocorrencia.diaSemana})`;
}

function interpretarPetDoBloco(valor = '') {
    const pet = normalizarTexto(valor);

    if (/^(?:sim|s|com pet|com animal)$/.test(pet)) return true;
    if (/^(?:nao|n|sem pet|sem animal)$/.test(pet)) return false;

    return null;
}

function formatarDadosReserva(campos = {}) {
    const linhas = [
        ['Nome', campos.nome],
        ['Data', campos.data],
        ['Horário', campos.horario],
        ['Quantidade de pessoas', campos['quantidade de pessoas']],
        ['Ambiente', campos.ambiente],
        ['Pet', campos.pet],
        ['Observações', campos.observacoes || '']
    ];

    return linhas
        .filter(([rotulo, valor]) => rotulo === 'Observações' || valor)
        .map(([rotulo, valor]) => `${rotulo}: ${valor}`.trimEnd())
        .join('\n');
}

function criarContextoReservaCliente({ expiracaoMs = 60 * 60 * 1000 } = {}) {
    const contextos = new Map();

    function obterContexto(chave, agora) {
        const contexto = contextos.get(chave);

        if (!contexto) return null;

        if (agora - contexto.atualizadoEm > expiracaoMs) {
            contextos.delete(chave);
            return null;
        }

        return contexto;
    }

    function atualizar(chave, texto, agora = Date.now()) {
        const pet = detectarIntencaoPet(texto);
        const ambiente = detectarAmbiente(texto);
        const dataReserva = detectarDataPorDiaSemana(texto, new Date(agora));
        const anterior = obterContexto(chave, agora) || {};
        const contexto = {
            ...anterior,
            atualizadoEm: agora
        };

        if (pet !== null) contexto.pet = pet;
        if (ambiente) contexto.ambiente = ambiente;
        if (dataReserva) contexto.dataReserva = dataReserva;

        contextos.set(chave, contexto);

        return {
            pet,
            ambiente,
            dataReserva,
            possuiCorrecaoExplicita: pet !== null || Boolean(ambiente) || Boolean(dataReserva)
        };
    }

    function reconciliar(chave, blocoReserva, agora = Date.now()) {
        const camposOriginais = extrairCamposReserva(blocoReserva);
        const campos = { ...camposOriginais };
        const contexto = obterContexto(chave, agora) || {};
        const petOriginal = interpretarPetDoBloco(camposOriginais.pet);
        const petFinal = typeof contexto.pet === 'boolean'
            ? contexto.pet
            : petOriginal;

        if (typeof petFinal === 'boolean') {
            campos.pet = petFinal ? 'sim' : 'não';
        }

        if (petFinal === true) {
            campos.ambiente = 'Externo';
        } else if (contexto.ambiente) {
            campos.ambiente = contexto.ambiente;
        }

        if (contexto.dataReserva) {
            campos.data = contexto.dataReserva;
        }

        const ambienteAlterado = Boolean(
            campos.ambiente &&
            normalizarTexto(campos.ambiente) !== normalizarTexto(camposOriginais.ambiente)
        );
        const petAlterado = typeof petFinal === 'boolean' && petOriginal !== petFinal;
        const dataAlterada = Boolean(
            campos.data &&
            normalizarTexto(campos.data) !== normalizarTexto(camposOriginais.data)
        );

        return {
            dadosReserva: formatarDadosReserva(campos),
            campos,
            alterado: ambienteAlterado || petAlterado || dataAlterada,
            preferencias: {
                pet: petFinal,
                ambiente: campos.ambiente || null,
                dataReserva: campos.data || null
            }
        };
    }

    function corrigirDataNaResposta(chave, resposta, agora = Date.now()) {
        const contexto = obterContexto(chave, agora);

        if (!contexto?.dataReserva || !/(reserv|hor[aá]rio|dados)/i.test(resposta || '')) {
            return resposta;
        }

        const dataCorreta = contexto.dataReserva.match(/^\d{2}\/\d{2}\/\d{4}/)?.[0];

        if (!dataCorreta) return resposta;

        return String(resposta).replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, dataCorreta);
    }

    return {
        atualizar,
        corrigirDataNaResposta,
        reconciliar
    };
}

module.exports = {
    criarContextoReservaCliente,
    detectarAmbiente,
    detectarDataPorDiaSemana,
    detectarIntencaoPet,
    formatarDadosReserva,
    normalizarTexto
};
