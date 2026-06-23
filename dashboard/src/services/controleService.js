const fs = require('fs');
const path = require('path');

function carregarControle(bot) {
    if (!bot.controlFile) {
        return { autoReply: true };
    }

    try {
        if (!fs.existsSync(bot.controlFile)) {
            fs.writeFileSync(bot.controlFile, JSON.stringify({ autoReply: true }, null, 2));
            return { autoReply: true };
        }

        const raw = fs.readFileSync(bot.controlFile, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        console.error('Erro ao carregar controle:', error.message);
        return { autoReply: true };
    }
}

function salvarControle(bot, controle) {
    if (!bot.controlFile) {
        return;
    }

    try {
        const dir = path.dirname(bot.controlFile);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(bot.controlFile, JSON.stringify(controle, null, 2));
    } catch (error) {
        console.error('Erro ao salvar controle:', error.message);
    }
}

module.exports = {
    carregarControle,
    salvarControle
};
