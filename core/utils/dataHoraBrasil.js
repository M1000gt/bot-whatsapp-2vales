function dataHoraBrasil() {
    const partes = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(new Date());

    const mapa = {};

    for (const parte of partes) {
        if (parte.type !== 'literal') {
            mapa[parte.type] = parte.value;
        }
    }

    return `${mapa.day}/${mapa.month}/${mapa.year}, ${mapa.hour}:${mapa.minute}:${mapa.second}`;
}

function mesAtualBrasil() {
    const partes = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit'
    }).formatToParts(new Date());

    const mapa = {};

    for (const parte of partes) {
        if (parte.type !== 'literal') {
            mapa[parte.type] = parte.value;
        }
    }

    return `${mapa.year}-${mapa.month}`;
}

module.exports = {
    dataHoraBrasil,
    mesAtualBrasil
};
