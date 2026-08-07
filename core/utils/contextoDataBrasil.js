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
    obterProximaOcorrenciaDiaSemana
};
