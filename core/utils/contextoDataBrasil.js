const FUSO_BRASIL = 'America/Sao_Paulo';

const ORDEM_DIAS_SEMANA = Object.freeze([
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado'
]);

const DIAS_ABERTOS = new Set([
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
    'domingo'
]);

const HORARIOS_POR_DIA = Object.freeze({
    'segunda-feira': 'FECHADO',
    'terça-feira': 'FECHADO',
    'quarta-feira': '12h às 22h',
    'quinta-feira': '12h às 22h',
    'sexta-feira': '12h às 23h',
    'sábado': '12h às 23h',
    'domingo': '12h às 17h'
});

function obterHorarioDoDia(diaSemana) {
    return HORARIOS_POR_DIA[diaSemana] || 'HORÁRIO NÃO CADASTRADO';
}

function normalizarDiaSemana(diaSemana = '') {
    const dia = String(diaSemana || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const aliases = {
        domingo: 'domingo',
        segunda: 'segunda-feira',
        'segunda-feira': 'segunda-feira',
        terca: 'terça-feira',
        'terca-feira': 'terça-feira',
        quarta: 'quarta-feira',
        'quarta-feira': 'quarta-feira',
        quinta: 'quinta-feira',
        'quinta-feira': 'quinta-feira',
        sexta: 'sexta-feira',
        'sexta-feira': 'sexta-feira',
        sabado: 'sábado'
    };

    return aliases[dia] || null;
}

function obterPartes(data) {
    const partes = new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO_BRASIL,
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(data);

    const mapa = {};

    for (const parte of partes) {
        if (parte.type !== 'literal') {
            mapa[parte.type] = parte.value;
        }
    }

    return mapa;
}

function adicionarDiasNaDataBrasil(data, quantidadeDias) {
    const origem = obterPartes(data);

    // Meio-dia UTC mantém a data civil estável durante a conversão para São Paulo.
    return new Date(Date.UTC(
        Number(origem.year),
        Number(origem.month) - 1,
        Number(origem.day) + quantidadeDias,
        12
    ));
}

function criarDataCivilValida(dia, mes, ano) {
    const data = new Date(Date.UTC(ano, mes - 1, dia, 12));

    if (
        data.getUTCFullYear() !== ano ||
        data.getUTCMonth() !== mes - 1 ||
        data.getUTCDate() !== dia
    ) {
        return null;
    }

    return data;
}

function chaveDataCivil(partes) {
    return Number(`${partes.year}${partes.month}${partes.day}`);
}

function descreverDataResolvida(data, dataBase, origem) {
    const partes = obterPartes(data);
    const hoje = obterPartes(dataBase);
    const diaSemana = partes.weekday;

    return {
        encontrada: true,
        valida: true,
        passada: chaveDataCivil(partes) < chaveDataCivil(hoje),
        origem,
        data: `${partes.day}/${partes.month}/${partes.year}`,
        diaSemana,
        aberto: DIAS_ABERTOS.has(diaSemana),
        horario: obterHorarioDoDia(diaSemana)
    };
}

function resolverDataMencionada(texto = '', dataBase = new Date()) {
    const mensagem = String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!mensagem) return null;

    const dataExplicita = mensagem.match(
        /\b(\d{1,2})\s*[\/.\-]\s*(\d{1,2})(?:\s*[\/.\-]\s*(\d{2,4}))?\b/
    );

    if (dataExplicita) {
        const dia = Number(dataExplicita[1]);
        const mes = Number(dataExplicita[2]);
        const hoje = obterPartes(dataBase);
        const anoInformado = dataExplicita[3]
            ? Number(dataExplicita[3].length === 2 ? `20${dataExplicita[3]}` : dataExplicita[3])
            : null;

        if (anoInformado) {
            const data = criarDataCivilValida(dia, mes, anoInformado);

            if (!data) {
                return {
                    encontrada: true,
                    valida: false,
                    passada: false,
                    origem: 'data-explicita',
                    motivo: 'data-inexistente'
                };
            }

            return descreverDataResolvida(data, dataBase, 'data-explicita');
        }

        const anoAtual = Number(hoje.year);
        const dataNoAnoAtual = criarDataCivilValida(dia, mes, anoAtual);

        if (dataNoAnoAtual) {
            const resultadoAtual = descreverDataResolvida(
                dataNoAnoAtual,
                dataBase,
                'data-sem-ano'
            );

            if (!resultadoAtual.passada) return resultadoAtual;

            // Perto da virada do ano, 02/01 em 31/12 normalmente significa
            // o próximo ano. Fora dessa janela, não transforme silenciosamente
            // uma data recém-passada em uma reserva para quase um ano depois.
            const dataProximoAno = criarDataCivilValida(dia, mes, anoAtual + 1);
            const hojeCivil = criarDataCivilValida(
                Number(hoje.day),
                Number(hoje.month),
                anoAtual
            );
            const diasAteProximoAno = dataProximoAno && hojeCivil
                ? Math.round((dataProximoAno - hojeCivil) / (24 * 60 * 60 * 1000))
                : null;

            if (diasAteProximoAno !== null && diasAteProximoAno <= 183) {
                return descreverDataResolvida(
                    dataProximoAno,
                    dataBase,
                    'data-sem-ano-proximo-ano'
                );
            }

            return resultadoAtual;
        }

        // Datas que não existem no ano atual, como 29/02 em ano não bissexto,
        // procuram a próxima ocorrência real. Datas impossíveis nunca passam.
        for (let acrescimo = 1; acrescimo <= 8; acrescimo += 1) {
            const data = criarDataCivilValida(dia, mes, anoAtual + acrescimo);
            if (data) {
                return descreverDataResolvida(data, dataBase, 'data-sem-ano');
            }
        }

        return {
            encontrada: true,
            valida: false,
            passada: false,
            origem: 'data-sem-ano',
            motivo: 'data-inexistente'
        };
    }

    if (/\bdepois de amanha\b/.test(mensagem)) {
        return descreverDataResolvida(
            adicionarDiasNaDataBrasil(dataBase, 2),
            dataBase,
            'depois-de-amanha'
        );
    }

    if (/\bamanha\b/.test(mensagem)) {
        return descreverDataResolvida(
            adicionarDiasNaDataBrasil(dataBase, 1),
            dataBase,
            'amanha'
        );
    }

    if (/\bhoje\b/.test(mensagem)) {
        return descreverDataResolvida(
            adicionarDiasNaDataBrasil(dataBase, 0),
            dataBase,
            'hoje'
        );
    }

    const diaDoMes = mensagem.match(/\bdia\s+(\d{1,2})\b/);
    if (diaDoMes) {
        const dia = Number(diaDoMes[1]);
        const hoje = obterPartes(dataBase);

        for (let acrescimoMes = 0; acrescimoMes <= 12; acrescimoMes += 1) {
            const referencia = new Date(Date.UTC(
                Number(hoje.year),
                Number(hoje.month) - 1 + acrescimoMes,
                1,
                12
            ));
            const ano = referencia.getUTCFullYear();
            const mes = referencia.getUTCMonth() + 1;
            const data = criarDataCivilValida(dia, mes, ano);

            if (!data) continue;

            const resultado = descreverDataResolvida(data, dataBase, 'dia-do-mes');
            if (!resultado.passada) return resultado;
        }

        return {
            encontrada: true,
            valida: false,
            passada: false,
            origem: 'dia-do-mes',
            motivo: 'dia-inexistente'
        };
    }

    const diaSemana = mensagem.match(
        /\b(segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado|domingo)\b/
    );

    if (diaSemana) {
        const diaInformado = diaSemana[1];
        const estritamenteFutura = new RegExp(
            `(?:proxim[oa]\\s+${diaInformado}|${diaInformado}\\s+que\\s+vem)`,
            'i'
        ).test(mensagem);
        const ocorrencia = obterProximaOcorrenciaDiaSemana(
            diaInformado,
            dataBase,
            { estritamenteFutura }
        );

        return ocorrencia
            ? {
                encontrada: true,
                valida: true,
                passada: false,
                origem: estritamenteFutura ? 'proximo-dia-semana' : 'dia-semana',
                ...ocorrencia
            }
            : null;
    }

    return null;
}

function obterProximaOcorrenciaDiaSemana(
    diaSemana,
    data = new Date(),
    { estritamenteFutura = false } = {}
) {
    const alvo = normalizarDiaSemana(diaSemana);

    if (!alvo) return null;

    const hoje = obterPartes(data);
    const indiceHoje = ORDEM_DIAS_SEMANA.indexOf(hoje.weekday);
    const indiceAlvo = ORDEM_DIAS_SEMANA.indexOf(alvo);
    let diferenca = (indiceAlvo - indiceHoje + 7) % 7;

    if (estritamenteFutura && diferenca === 0) {
        diferenca = 7;
    }

    const ocorrencia = obterPartes(adicionarDiasNaDataBrasil(data, diferenca));

    return {
        data: `${ocorrencia.day}/${ocorrencia.month}/${ocorrencia.year}`,
        diaSemana: ocorrencia.weekday,
        aberto: DIAS_ABERTOS.has(ocorrencia.weekday),
        horario: obterHorarioDoDia(ocorrencia.weekday)
    };
}

function obterCalendarioProximosDias(data = new Date(), quantidadeDias = 8) {
    return Array.from({ length: quantidadeDias }, (_, indice) => {
        const partes = obterPartes(adicionarDiasNaDataBrasil(data, indice));

        return {
            data: `${partes.day}/${partes.month}/${partes.year}`,
            diaSemana: partes.weekday,
            aberto: DIAS_ABERTOS.has(partes.weekday),
            horario: obterHorarioDoDia(partes.weekday)
        };
    });
}

function obterContextoDataBrasil(data = new Date()) {
    const hoje = obterPartes(data);

    // Meio-dia UTC evita que a conversão de fuso volte para o dia anterior.
    const referenciaAmanha = new Date(Date.UTC(
        Number(hoje.year),
        Number(hoje.month) - 1,
        Number(hoje.day) + 1,
        12
    ));

    const amanha = obterPartes(referenciaAmanha);

    return {
        dataAtual: `${hoje.day}/${hoje.month}/${hoje.year}`,
        horaAtual: `${hoje.hour}:${hoje.minute}:${hoje.second}`,
        diaSemana: hoje.weekday,
        abertoHoje: DIAS_ABERTOS.has(hoje.weekday),
        horarioHoje: obterHorarioDoDia(hoje.weekday),
        dataAmanha: `${amanha.day}/${amanha.month}/${amanha.year}`,
        diaSemanaAmanha: amanha.weekday,
        abertoAmanha: DIAS_ABERTOS.has(amanha.weekday),
        horarioAmanha: obterHorarioDoDia(amanha.weekday),
        calendarioProximosDias: obterCalendarioProximosDias(data)
    };
}

module.exports = {
    FUSO_BRASIL,
    HORARIOS_POR_DIA,
    ORDEM_DIAS_SEMANA,
    normalizarDiaSemana,
    obterCalendarioProximosDias,
    obterHorarioDoDia,
    obterContextoDataBrasil,
    obterProximaOcorrenciaDiaSemana,
    resolverDataMencionada
};
