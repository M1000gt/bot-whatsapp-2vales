const FUSO_BRASIL = 'America/Sao_Paulo';

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
        horarioAmanha: obterHorarioDoDia(amanha.weekday)
    };
}

module.exports = {
    FUSO_BRASIL,
    HORARIOS_POR_DIA,
    obterHorarioDoDia,
    obterContextoDataBrasil
};
