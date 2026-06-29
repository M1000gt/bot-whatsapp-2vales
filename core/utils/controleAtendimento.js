const fs = require('fs');
const path = require('path');

function criarControleAtendimento(controlPath) {
    function carregarControle() {
        try {
            if (!controlPath) {
                return { autoReply: true };
            }

            if (!fs.existsSync(controlPath)) {
                fs.mkdirSync(path.dirname(controlPath), { recursive: true });
                fs.writeFileSync(controlPath, JSON.stringify({ autoReply: true }, null, 2));
                return { autoReply: true };
            }

            const raw = fs.readFileSync(controlPath, 'utf8');
            return JSON.parse(raw);
        } catch (error) {
            console.error('Erro ao carregar controle de atendimento:', error.message);
            return { autoReply: true };
        }
    }

    function salvarControle(controle) {
        try {
            if (!controlPath) return;

            fs.mkdirSync(path.dirname(controlPath), { recursive: true });
            fs.writeFileSync(controlPath, JSON.stringify(controle, null, 2));
        } catch (error) {
            console.error('Erro ao salvar controle de atendimento:', error.message);
        }
    }

    function atendimentoAutomaticoAtivo() {
        const controle = carregarControle();
        return controle.autoReply !== false;
    }

    return {
        carregarControle,
        salvarControle,
        atendimentoAutomaticoAtivo
    };
}

module.exports = {
    criarControleAtendimento
};
