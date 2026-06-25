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

function getMonthlyDirFromLog(logFile, tipo) {
    if (!logFile) return null;
    return path.join(path.dirname(logFile), tipo);
}

function getMonthlyFilePath(logFile, tipo, mes) {
    const dir = getMonthlyDirFromLog(logFile, tipo);
    if (!dir || !mes) return null;
    return path.join(dir, `${mes}.log`);
}

function listarMesesDisponiveis(logFile, tipo) {
    try {
        const dir = getMonthlyDirFromLog(logFile, tipo);

        if (!dir || !fs.existsSync(dir)) {
            return [];
        }

        return fs.readdirSync(dir)
            .filter(file => /^\d{4}-\d{2}\.log$/.test(file))
            .map(file => file.replace('.log', ''))
            .sort()
            .reverse();
    } catch (error) {
        console.error('Erro ao listar meses disponíveis:', error.message);
        return [];
    }
}

function lerArquivoSeguro(filePath, fallback) {
    try {
        if (!filePath || !fs.existsSync(filePath)) {
            return fallback;
        }

        return fs.readFileSync(filePath, 'utf8') || fallback;
    } catch (error) {
        console.error('Erro ao ler arquivo de log:', error.message);
        return fallback;
    }
}

function lerLogPorMes({ logFile, tipo, mes, fallback }) {
    const meses = listarMesesDisponiveis(logFile, tipo);
    const mesSelecionado = mes || meses[0] || obterMesAtualBrasil();

    const mensalPath = getMonthlyFilePath(logFile, tipo, mesSelecionado);

    if (mensalPath && fs.existsSync(mensalPath)) {
        return {
            conteudo: lerArquivoSeguro(mensalPath, fallback),
            meses,
            mesSelecionado,
            filePath: mensalPath,
            origem: 'mensal'
        };
    }

    if (!mes && logFile && fs.existsSync(logFile)) {
        return {
            conteudo: lerArquivoSeguro(logFile, fallback),
            meses,
            mesSelecionado: 'legado',
            filePath: logFile,
            origem: 'legado'
        };
    }

    return {
        conteudo: fallback,
        meses,
        mesSelecionado,
        filePath: null,
        origem: 'vazio'
    };
}

module.exports = {
    obterMesAtualBrasil,
    listarMesesDisponiveis,
    lerLogPorMes
};
