const fs = require('fs');
const path = require('path');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const { responderComIA } = require('./ana/Ana');
const { atendimentoAutomaticoAtivo } = require('./Utils/controleAtendimento');
const {
    registrarEnvioAutomatico,
    processarMensagemEnviadaPeloNumero,
    atendimentoHumanoAtivo
} = require('./Utils/handoffHumano');
const { registrarLogMensal } = require('./Utils/logMensal');

const { dataHoraBrasil } = require('../../core/utils/dataHoraBrasil');
const { processarMensagemCliente } = require('../../core/atendimento/processadorMensagem');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const CONFIG_EXAMPLE_PATH = path.join(__dirname, 'config.example.json');

function carregarConfig() {
    const caminho = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : CONFIG_EXAMPLE_PATH;

    if (!fs.existsSync(caminho)) {
        throw new Error('Nenhum arquivo de configuração encontrado.');
    }

    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}

const config = carregarConfig();


const historicosConversas = new Map();
const LIMITE_HISTORICO_CONVERSA = 8;

function adicionarHistorico(chatId, papel, texto) {
    if (!chatId || !texto) return;

    const lista = historicosConversas.get(chatId) || [];

    lista.push({
        papel,
        texto: String(texto).slice(0, 800),
        data: new Date().toISOString()
    });

    while (lista.length > LIMITE_HISTORICO_CONVERSA) {
        lista.shift();
    }

    historicosConversas.set(chatId, lista);
}

function obterHistorico(chatId) {
    const lista = historicosConversas.get(chatId) || [];

    if (!lista.length) {
        return 'Sem histórico recente.';
    }

    return lista
        .map(item => `${item.papel}: ${item.texto}`)
        .join('\n');
}


const logsDir = path.join(__dirname, 'logs');
const conversaLogPath = path.join(logsDir, 'conversas.log');

fs.mkdirSync(logsDir, { recursive: true });

function salvarJson(caminho, data) {
    try {
        fs.mkdirSync(path.dirname(caminho), { recursive: true });
        fs.writeFileSync(caminho, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro ao salvar JSON:', error.message);
    }
}

async function salvarQrCode(qr) {
    const statusPath = config.qrStatus || path.join(__dirname, 'qrcode-status.json');
    const qrImagePath = config.qrImage || path.join(__dirname, 'qrcode.png');

    salvarJson(statusPath, {
        status: 'aguardando_qr',
        updatedAt: new Date().toISOString()
    });

    try {
        const QRCode = require('qrcode');
        fs.mkdirSync(path.dirname(qrImagePath), { recursive: true });
        await QRCode.toFile(qrImagePath, qr);
        console.log('✅ QR Code salvo em:', qrImagePath);
    } catch (error) {
        console.log('⚠️ Não consegui salvar QR em imagem. Mostrando apenas no terminal.');
        console.log('Motivo:', error.message);
    }
}

function marcarQrConectado() {
    const statusPath = config.qrStatus || path.join(__dirname, 'qrcode-status.json');

    salvarJson(statusPath, {
        status: 'conectado',
        updatedAt: new Date().toISOString()
    });
}

function marcarQrDesconectado(reason) {
    const statusPath = config.qrStatus || path.join(__dirname, 'qrcode-status.json');

    salvarJson(statusPath, {
        status: 'desconectado',
        reason: reason || null,
        updatedAt: new Date().toISOString()
    });
}

async function registrarConversaLimpa(message, origem, texto) {
    try {
        const chatId = message.from || message.to || 'desconhecido';

        const linha = `[${dataHoraBrasil()}] ${origem}
Chat: ${chatId}
Mensagem: ${texto}

`;

        fs.appendFileSync(conversaLogPath, linha, 'utf8');
        registrarLogMensal('conversas', linha);
    } catch (error) {
        console.error('Erro ao registrar conversa:', error.message);
    }
}

function grupoInternoValido() {
    return (
        config.grupoInterno &&
        config.grupoInterno.includes('@g.us') &&
        !config.grupoInterno.includes('COLE_AQUI')
    );
}

async function enviarAvisoInterno(texto) {
    try {
        if (!grupoInternoValido()) {
            console.log('⚠️ Grupo interno não configurado. Aviso interno não enviado.');
            return;
        }

        await client.sendMessage(config.grupoInterno, texto);
    } catch (error) {
        console.error('Erro ao enviar aviso interno:', error.message);
    }
}







function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calcularTempoDigitando(texto) {
    const tamanho = String(texto || '').length;
    const tempo = 900 + tamanho * 8;

    return Math.min(Math.max(tempo, 1200), 2800);
}

async function tentarEnviarDigitando(chatId) {
    let ultimoErro = null;

    try {
        if (typeof client.sendPresenceAvailable === 'function') {
            await client.sendPresenceAvailable();
        }
    } catch (_) {}

    try {
        const chat = await client.getChatById(chatId);

        if (chat && typeof chat.sendStateTyping === 'function') {
            await chat.sendStateTyping();
            return {
                ok: true,
                metodo: 'chat.sendStateTyping'
            };
        }
    } catch (error) {
        ultimoErro = error;
    }

    try {
        if (client.pupPage) {
            const resultado = await client.pupPage.evaluate((id) => {
                if (window.WWebJS && typeof window.WWebJS.sendChatstate === 'function') {
                    window.WWebJS.sendChatstate('typing', id);
                    return true;
                }

                return false;
            }, chatId);

            if (resultado) {
                return {
                    ok: true,
                    metodo: 'window.WWebJS.sendChatstate'
                };
            }
        }
    } catch (error) {
        ultimoErro = error;
    }

    return {
        ok: false,
        erro: ultimoErro ? (ultimoErro.stack || ultimoErro.message || String(ultimoErro)) : 'sem detalhe'
    };
}

async function iniciarDigitando(message) {
    const chatId = message.from;
    let intervalo = null;
    let ativo = true;

    const primeiraTentativa = await tentarEnviarDigitando(chatId);

    if (primeiraTentativa.ok) {
        console.log(`⌨️ Digitando iniciado para ${chatId} via ${primeiraTentativa.metodo}`);

        intervalo = setInterval(async () => {
            if (!ativo) return;

            const novaTentativa = await tentarEnviarDigitando(chatId);

            if (novaTentativa.ok) {
                console.log(`⌨️ Digitando renovado para ${chatId} via ${novaTentativa.metodo}`);
            } else {
                console.log(`⚠️ Não consegui renovar digitando para ${chatId}: ${novaTentativa.erro}`);
            }
        }, 7000);
    } else {
        console.log(`⚠️ Não consegui iniciar digitando para ${chatId}: ${primeiraTentativa.erro}`);
    }

    return async function pararDigitando() {
        ativo = false;

        if (intervalo) {
            clearInterval(intervalo);
        }

        try {
            const chat = await client.getChatById(chatId);

            if (chat && typeof chat.clearState === 'function') {
                await chat.clearState();
            }
        } catch (_) {}

        console.log('⌨️ Digitando finalizado para:', chatId);
    };
}


async function obterContatoSeguro(message) {
    try {
        const contato = await message.getContact();

        return {
            nome: contato.pushname || contato.name || 'Cliente',
            numero: message.from,
            historico: ''
        };
    } catch (error) {
        return {
            nome: 'Cliente',
            numero: message.from,
            historico: ''
        };
    }
}

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: config.clientId || config.slug || 'cliente-modelo',
        dataPath: path.join(__dirname, '.wwebjs_auth')
    }),

    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
        ]
    },

    webVersionCache: {
        type: 'local'
    }
});

const sendMessageOriginal = client.sendMessage.bind(client);

client.sendMessage = async (chatId, content, options) => {
    registrarEnvioAutomatico(chatId, content);
    return sendMessageOriginal(chatId, content, options);
};

client.on('qr', async (qr) => {
    console.log(`📲 QR Code gerado para ${config.nome || config.slug}`);
    qrcodeTerminal.generate(qr, { small: true });
    await salvarQrCode(qr);
});

client.on('ready', () => {
    console.log(`✅ ${config.nome || config.slug} conectado e pronto.`);
    marcarQrConectado();
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha de autenticação:', msg);
    marcarQrDesconectado('auth_failure');
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente desconectado:', reason);
    marcarQrDesconectado(reason);
});

client.on('message_create', async (message) => {
    await processarMensagemEnviadaPeloNumero(message, registrarConversaLimpa);
});

client.on('message', async (message) => {
    try {
        if (!message.body) return;
        if (message.fromMe) return;
        if (message.from === 'status@broadcast') return;
        if (message.from.endsWith('@g.us')) return;

        const textoCliente = message.body.trim();

        await registrarConversaLimpa(message, 'CLIENTE', textoCliente);

        if (!atendimentoAutomaticoAtivo()) {
            await registrarConversaLimpa(message, 'SISTEMA', 'Atendimento automático pausado pelo painel.');
            console.log('⏸️ Atendimento automático pausado pelo painel.');
            return;
        }

        if (atendimentoHumanoAtivo(message.from)) {
            await registrarConversaLimpa(message, 'SISTEMA', 'Atendimento humano ativo nesta conversa. Bot não respondeu.');
            console.log('👤 Atendimento humano ativo. Bot não respondeu:', message.from);
            return;
        }

        const contato = await obterContatoSeguro(message);
        contato.historico = obterHistorico(message.from);

        adicionarHistorico(message.from, 'CLIENTE', textoCliente);

        const pararDigitando = await iniciarDigitando(message);

        let resultado;

        try {
            resultado = await processarMensagemCliente({
                texto: textoCliente,
                contato,
                responderComIA
            });
        } catch (error) {
            await pararDigitando();
            throw error;
        }

        if (resultado.avisoInterno) {
            await enviarAvisoInterno(resultado.avisoInterno);
            await registrarConversaLimpa(message, resultado.tipo, resultado.avisoInterno);
        }

        if (!resultado.deveResponderCliente) {
            await pararDigitando();
            console.log(`🚫 Mensagem não respondida ao cliente. Tipo: ${resultado.tipo}`);
            return;
        }

        if (resultado.respostaCliente) {
            await esperar(calcularTempoDigitando(resultado.respostaCliente));
            await client.sendMessage(message.from, resultado.respostaCliente);
            await pararDigitando();
            adicionarHistorico(message.from, 'ASSISTENTE', resultado.respostaCliente);
            await registrarConversaLimpa(message, 'ASSISTENTE', resultado.respostaCliente);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error.message);

        try {
            await registrarConversaLimpa(message, 'ERRO', error.message);
        } catch (_) {}
    }
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

console.log(`🚀 Iniciando bot universal: ${config.nome || config.slug}`);
client.initialize();
