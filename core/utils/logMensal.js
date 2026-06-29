const fs = require('fs');
const path = require('path');
const { mesAtualBrasil } = require('./dataHoraBrasil');

function criarLogMensal(config = {}) {
    const baseLogsDir = config.baseLogsDir;

    function registrarLogMensal(tipo, conteudo) {
        try {
            if (!baseLogsDir) {
                console.error('baseLogsDir não configurado no log mensal.');
                return;
            }

            const logsDir = path.join(baseLogsDir, tipo);
            fs.mkdirSync(logsDir, { recursive: true });

            const arquivo = path.join(logsDir, `${mesAtualBrasil()}.log`);
            const textoFinal = String(conteudo || '').endsWith('\n')
                ? String(conteudo || '')
                : String(conteudo || '') + '\n';

            fs.appendFileSync(arquivo, textoFinal, 'utf8');
        } catch (error) {
            console.error(`Erro ao registrar log mensal (${tipo}):`, error.message);
        }
    }

    return {
        registrarLogMensal
    };
}

module.exports = {
    criarLogMensal
};
