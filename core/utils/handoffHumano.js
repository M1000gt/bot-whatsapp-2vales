const fs = require('fs');
const path = require('path');

function criarHandoffHumano(config = {}) {
    const handoffPath = config.handoffPath;
    const minutosPadrao = config.minutosPadrao || 30;
    const enviosAutomaticosRecentes = new Map();

    function carregarHandoff() {
        try {
            if (!handoffPath) return {};

            if (!fs.existsSync(handoffPath)) {
                fs.mkdirSync(path.dirname(handoffPath), { recursive: true });
                fs.writeFileSync(handoffPath, JSON.stringify({}, null, 2));
                return {};
            }

            return JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
        } catch (error) {
            console.error('Erro ao carregar handoff humano:', error.message);
            return {};
        }
    }

    function salvarHandoff(data) {
        try {
            if (!handoffPath) return;

            fs.mkdirSync(path.dirname(handoffPath), { recursive: true });
            fs.writeFileSync(handoffPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Erro ao salvar handoff humano:', error.message);
        }
    }

    function ativarAtendimentoHumano(chatId, minutos = minutosPadrao, motivo = 'Atendente humano respondeu') {
        const data = carregarHandoff();

        data[chatId] = {
            ativoAte: Date.now() + minutos * 60 * 1000,
            motivo,
            updatedAt: new Date().toISOString()
        };

        salvarHandoff(data);
    }

    function atendimentoHumanoAtivo(chatId) {
        const data = carregarHandoff();
        const item = data[chatId];

        if (!item) return false;

        if (Date.now() > item.ativoAte) {
            delete data[chatId];
            salvarHandoff(data);
            return false;
        }

        return true;
    }

    function registrarEnvioAutomatico(chatId, conteudo) {
        const texto = typeof conteudo === 'string' ? conteudo.trim() : '';

        enviosAutomaticosRecentes.set(chatId, {
            texto,
            timestamp: Date.now()
        });

        setTimeout(() => {
            enviosAutomaticosRecentes.delete(chatId);
        }, 20000);
    }

    function foiEnvioAutomaticoRecente(chatId, textoMensagem) {
        const item = enviosAutomaticosRecentes.get(chatId);

        if (!item) return false;

        const dentroDaJanela = Date.now() - item.timestamp < 15000;
        if (!dentroDaJanela) return false;

        const textoAtual = typeof textoMensagem === 'string' ? textoMensagem.trim() : '';

        if (!item.texto || !textoAtual) {
            return true;
        }

        return item.texto === textoAtual;
    }

    async function processarMensagemEnviadaPeloNumero(message, registrarConversaLimpa) {
        try {
            if (!message.fromMe) return false;

            const chatId = message.to;

            if (!chatId) return false;
            if (chatId === 'status@broadcast') return false;
            if (chatId.endsWith('@g.us')) return false;

            const texto = message.body && message.body.trim()
                ? message.body.trim()
                : '[mensagem enviada manualmente pelo atendente]';

            if (foiEnvioAutomaticoRecente(chatId, texto)) {
                return false;
            }

            ativarAtendimentoHumano(chatId, minutosPadrao, 'Atendente humano respondeu nesta conversa');

            console.log(`👤 Atendimento humano detectado em ${chatId}. Ana pausada por ${minutosPadrao} minutos nessa conversa.`);

            if (typeof registrarConversaLimpa === 'function') {
                await registrarConversaLimpa(message, 'ATENDENTE HUMANO', texto);
                await registrarConversaLimpa(message, 'SISTEMA', `Ana pausada automaticamente nesta conversa por ${minutosPadrao} minutos porque um atendente humano respondeu.`);
            }

            return true;
        } catch (error) {
            console.error('Erro no handoff humano:', error.message);
            return false;
        }
    }

    return {
        ativarAtendimentoHumano,
        atendimentoHumanoAtivo,
        registrarEnvioAutomatico,
        processarMensagemEnviadaPeloNumero
    };
}

module.exports = {
    criarHandoffHumano
};
