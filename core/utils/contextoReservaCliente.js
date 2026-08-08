const { extrairCamposReserva } = require('./acoesAna');
const {
    obterProximaOcorrenciaDiaSemana,
    resolverDataMencionada
} = require('./contextoDataBrasil');
const {
    detectarComandoDataRelativa
} = require('./intencaoDataReserva');

const ORIGENS_DIA_SEMANA = new Set([
    'dia-semana',
    'proximo-dia-semana',
    'outro-dia-semana'
]);

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
    const resultado = resolverDataMencionada(texto, dataBase);

    if (!resultado || !/dia-semana/.test(resultado.origem || '')) return null;

    return `${resultado.data} (${resultado.diaSemana})`;
}

function detectarDataReserva(texto = '', dataBase = new Date()) {
    const resultado = resolverDataMencionada(texto, dataBase);

    if (!resultado) return null;

    return {
        ...resultado,
        dataFormatada: resultado.valida
            ? `${resultado.data} (${resultado.diaSemana})`
            : null
    };
}

function resultadoEhDiaSemana(resultado) {
    return Boolean(resultado && ORIGENS_DIA_SEMANA.has(resultado.origem));
}

function criarDataResolvidaRelativa(ocorrencia, modo) {
    if (!ocorrencia) return null;

    return {
        encontrada: true,
        valida: true,
        passada: false,
        origem: `data-relativa-${modo}`,
        ...ocorrencia,
        dataFormatada: `${ocorrencia.data} (${ocorrencia.diaSemana})`
    };
}

function interpretarPetDoBloco(valor = '') {
    const pet = normalizarTexto(valor);

    if (/^(?:sim|s|com pet|com animal)$/.test(pet)) return true;
    if (/^(?:nao|n|sem pet|sem animal)$/.test(pet)) return false;

    return null;
}

function mensagemPareceReservaComDadosSuficientes(texto = '') {
    const mensagem = normalizarTexto(texto);
    const possuiHorario = mensagemTemHorario(mensagem);
    const possuiQuantidade = /\b\d{1,3}\s*(?:pessoas?|pax)\b/.test(mensagem);
    const possuiAmbiente = /\b(?:intern[oa]|extern[oa]|sala vip|sala reservada)\b/.test(mensagem);

    return possuiHorario && possuiQuantidade && possuiAmbiente;
}

function mensagemTemHorario(texto = '') {
    return /\b(?:[01]?\d|2[0-3])(?:\s*:\s*[0-5]\d|\s*h(?:rs?|oras?)?|\s+horas?)\b/.test(
        normalizarTexto(texto)
    );
}

function mensagemIniciaFluxoReserva(texto = '') {
    const mensagem = normalizarTexto(texto);

    if (/\b(?:reserv(?:a|ar|as|ado|ada|acao)|mesa)\b/.test(mensagem)) {
        return true;
    }

    const possuiQuantidade = /\b\d{1,3}\s*(?:pessoas?|pax)\b/.test(mensagem);
    const possuiOutroDado = (
        mensagemTemHorario(mensagem) ||
        /\b(?:segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado|domingo|hoje|amanha)\b/.test(mensagem) ||
        /\b(?:intern[oa]|extern[oa]|sala vip|sala reservada)\b/.test(mensagem)
    );

    return possuiQuantidade && possuiOutroDado;
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

function validarDataResolvidaParaReserva(dataResolvida) {
    let motivo = null;

    if (!dataResolvida || !dataResolvida.valida) {
        motivo = dataResolvida?.motivo || 'data-nao-validada';
    } else if (dataResolvida.passada) {
        motivo = 'data-passada';
    } else if (!dataResolvida.aberto) {
        motivo = 'restaurante-fechado';
    }

    return {
        aceita: !motivo,
        motivo,
        detalhes: dataResolvida || null
    };
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
        const anterior = obterContexto(chave, agora) || {};
        const fluxoReservaAtivo = Boolean(
            anterior.fluxoReservaAtivo || mensagemIniciaFluxoReserva(texto)
        );
        const dataDetectada = fluxoReservaAtivo
            ? detectarDataReserva(texto, new Date(agora))
            : null;
        const referenciaAnterior = anterior.fluxoReservaAtivo
            ? (anterior.referenciaDiaSemana || null)
            : null;
        const comandoDataRelativa = fluxoReservaAtivo
            ? detectarComandoDataRelativa(texto, {
                diaSemanaAnterior: referenciaAnterior?.diaSemana || null
            })
            : null;
        let dataResolvida = dataDetectada;
        let referenciaDiaSemana = referenciaAnterior;
        let operacaoDataRelativa = null;

        if (comandoDataRelativa) {
            const mesmoDiaAnterior = Boolean(
                referenciaAnterior?.diaSemana === comandoDataRelativa.diaSemana
            );
            const estritamenteFutura = mesmoDiaAnterior
                ? Boolean(referenciaAnterior.estritamenteFutura)
                : dataDetectada?.origem === 'proximo-dia-semana';
            const ocorrenciaAnterior = mesmoDiaAnterior
                ? referenciaAnterior.ocorrencia
                : null;
            const ocorrenciaAlvo = comandoDataRelativa.tipo === 'avancar-ocorrencia'
                ? ((ocorrenciaAnterior || 1) + 1)
                : comandoDataRelativa.ocorrenciaAlvo;
            const ocorrencia = obterProximaOcorrenciaDiaSemana(
                comandoDataRelativa.diaSemana,
                new Date(agora),
                {
                    estritamenteFutura,
                    pularOcorrencias: Math.max(0, ocorrenciaAlvo - 1)
                }
            );

            dataResolvida = criarDataResolvidaRelativa(
                ocorrencia,
                comandoDataRelativa.modo
            );
            referenciaDiaSemana = {
                diaSemana: comandoDataRelativa.diaSemana,
                estritamenteFutura,
                ocorrencia: ocorrenciaAlvo
            };
            operacaoDataRelativa = {
                ...comandoDataRelativa,
                ocorrenciaAnterior,
                ocorrenciaAlvo,
                dataAnteriorResolvida: anterior.dataResolvida || null,
                dataResolvida
            };
        } else if (resultadoEhDiaSemana(dataDetectada)) {
            referenciaDiaSemana = {
                diaSemana: dataDetectada.diaSemana,
                estritamenteFutura: dataDetectada.origem === 'proximo-dia-semana',
                ocorrencia: dataDetectada.origem === 'outro-dia-semana' ? 2 : 1
            };
        } else if (dataDetectada) {
            referenciaDiaSemana = null;
        }

        const dataReserva = dataResolvida?.dataFormatada || null;
        const dataAnteriorResolvida = anterior.dataResolvida || null;
        const correcaoDataRelativa = Boolean(
            dataAnteriorResolvida &&
            operacaoDataRelativa &&
            dataAnteriorResolvida.data !== dataResolvida.data
        );
        const reafirmacaoDataRelativa = Boolean(
            dataAnteriorResolvida &&
            operacaoDataRelativa &&
            dataAnteriorResolvida.data === dataResolvida.data
        );
        const contexto = {
            ...anterior,
            fluxoReservaAtivo,
            atualizadoEm: agora
        };

        if (pet !== null) contexto.pet = pet;
        if (ambiente) contexto.ambiente = ambiente;
        if (dataResolvida) {
            contexto.dataResolvida = dataResolvida;
            contexto.dataReserva = dataReserva;
        }
        if (referenciaDiaSemana) {
            contexto.referenciaDiaSemana = referenciaDiaSemana;
        } else if (dataDetectada) {
            delete contexto.referenciaDiaSemana;
        }

        contextos.set(chave, contexto);

        return {
            pet,
            ambiente,
            dataReserva,
            dataResolvida,
            dataAnteriorResolvida,
            operacaoDataRelativa,
            correcaoDataRelativa,
            reafirmacaoDataRelativa,
            possuiCorrecaoExplicita: pet !== null || Boolean(ambiente) || Boolean(dataResolvida)
        };
    }

    function limparData(chave, agora = Date.now()) {
        const contexto = obterContexto(chave, agora);

        if (!contexto) return false;

        delete contexto.dataResolvida;
        delete contexto.dataReserva;
        delete contexto.referenciaDiaSemana;
        contexto.atualizadoEm = agora;
        contextos.set(chave, contexto);
        return true;
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

        const dataResolvida = contexto.dataResolvida ||
            detectarDataReserva(campos.data, new Date(agora));
        const validacaoData = validarDataResolvidaParaReserva(dataResolvida);

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
            },
            validacaoData
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
        limparData,
        reconciliar
    };
}

function criarRespostaCorrecaoDataRelativa({
    dataResolvida,
    dataAnteriorResolvida,
    operacaoDataRelativa
} = {}) {
    if (!dataResolvida?.data || !dataResolvida?.diaSemana) {
        return 'Entendi que o senhor deseja outra data, mas não consegui validá-la com segurança. Poderia informá-la no formato dia/mês/ano?';
    }

    const ocorrenciaAlvo = operacaoDataRelativa?.ocorrenciaAlvo || null;
    const horario = dataResolvida.horario && dataResolvida.horario !== 'FECHADO'
        ? ` O horário de funcionamento nesse dia é ${dataResolvida.horario}.`
        : '';

    if (dataAnteriorResolvida?.data === dataResolvida.data) {
        return `Certo. A data continua sendo ${dataResolvida.data} (${dataResolvida.diaSemana}). Vou manter essa data na solicitação.${horario}`;
    }

    if (!dataAnteriorResolvida?.data) {
        const explicacao = ocorrenciaAlvo && ocorrenciaAlvo > 1
            ? `, a ${ocorrenciaAlvo}ª ocorrência desse dia da semana a partir de hoje`
            : '';

        return `Entendi. Para a reserva, vou considerar ${dataResolvida.data} (${dataResolvida.diaSemana})${explicacao}.${horario} Agora me informe, por favor, nome, horário desejado, quantidade de pessoas, ambiente e se haverá pet.`;
    }

    return `Entendi. Então a solicitação não será para ${dataAnteriorResolvida.data}, e sim para ${dataResolvida.data} (${dataResolvida.diaSemana}).${horario} Vou considerar essa nova data nas próximas mensagens.`;
}

function criarRespostaDataReservaInvalida(validacaoData = {}) {
    const { motivo, detalhes } = validacaoData;

    if (motivo === 'data-passada') {
        return 'Essa data já passou, então não consigo encaminhá-la como uma nova solicitação de reserva. Qual data futura o senhor prefere?';
    }

    if (motivo === 'restaurante-fechado') {
        const referencia = detalhes?.data && detalhes?.diaSemana
            ? `em ${detalhes.data} (${detalhes.diaSemana})`
            : 'nessa data';

        return `O restaurante estará fechado ${referencia}. Funcionamos de quarta-feira a domingo. Qual outro dia o senhor prefere?`;
    }

    if (motivo === 'data-inexistente' || motivo === 'dia-inexistente') {
        return 'A data informada não existe no calendário. Poderia conferir e me enviar uma nova data, por favor?';
    }

    return 'Não consegui validar essa data com segurança. Poderia informá-la no formato dia/mês/ano, por favor?';
}

module.exports = {
    criarContextoReservaCliente,
    criarRespostaCorrecaoDataRelativa,
    criarRespostaDataReservaInvalida,
    detectarAmbiente,
    detectarDataReserva,
    detectarDataPorDiaSemana,
    detectarIntencaoPet,
    formatarDadosReserva,
    mensagemPareceReservaComDadosSuficientes,
    mensagemIniciaFluxoReserva,
    normalizarTexto,
    validarDataResolvidaParaReserva
};
