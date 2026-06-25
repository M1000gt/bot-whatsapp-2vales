const fs = require('fs');
const path = require('path');

const CONTROL_PATH = path.join(__dirname, '..', 'control.json');

function carregarControle() {
    try {
        if (!fs.existsSync(CONTROL_PATH)) {
            fs.writeFileSync(CONTROL_PATH, JSON.stringify({ autoReply: true }, null, 2));
            return { autoReply: true };
        }

        const raw = fs.readFileSync(CONTROL_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        console.error('Erro ao carregar control.json:', error.message);
        return { autoReply: true };
    }
}

function atendimentoAutomaticoAtivo() {
    const controle = carregarControle();
    return controle.autoReply !== false;
}

module.exports = {
    atendimentoAutomaticoAtivo
};
