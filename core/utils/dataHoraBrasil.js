const FUSO_BRASIL = 'America/Sao_Paulo';

function obterPartesBrasil(data = new Date(), opcoes = {}) {
    const partes = new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO_BRASIL,
        ...opcoes
    }).formatToParts(data);

    const mapa = {};

    for (const parte of partes) {
        if (parte.type !== 'literal') {
            mapa[parte.type] = parte.value;
        }
    }

    return mapa;
}

function dataHoraBrasil(data = new Date()) {
    const mapa = obterPartesBrasil(data, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    });

    return `${mapa.day}/${mapa.month}/${mapa.year}, ${mapa.hour}:${mapa.minute}:${mapa.second}`;
}

function mesAtualBrasil(data = new Date()) {
    const mapa = obterPartesBrasil(data, {
        year: 'numeric',
        month: '2-digit'
    });

    return `${mapa.year}-${mapa.month}`;
}

function obterHoraBrasil(data = new Date()) {
    const mapa = obterPartesBrasil(data, {
        hour: '2-digit',
        hourCycle: 'h23'
    });

    return Number(mapa.hour);
}

module.exports = {
    FUSO_BRASIL,
    dataHoraBrasil,
    mesAtualBrasil,
    obterHoraBrasil
};
