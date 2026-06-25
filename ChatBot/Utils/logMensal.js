const fs = require('fs');
const path = require('path');

function obterMesAtualBrasil() {
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

function registrarLogMensal(tipo, conteudo) {
    try {
        const logsDir = path.join(__dirname, '..', 'logs', tipo);
        fs.mkdirSync(logsDir, { recursive: true });

        const arquivo = path.join(logsDir, `${obterMesAtualBrasil()}.log`);
        const textoFinal = conteudo.endsWith('\n') ? conteudo : conteudo + '\n';

        fs.appendFileSync(arquivo, textoFinal, 'utf8');
    } catch (error) {
        console.error(`Erro ao registrar log mensal (${tipo}):`, error.message);
    }
}

module.exports = {
    registrarLogMensal
};
