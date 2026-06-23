const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const enviar = require('./Utils/enviar');
const { falarComAna } = require('./ana/Ana');
const { grupoLeads } = require('./config/config');

// ========================================
// CAMINHOS DA DEMO
// ========================================

const CONTROL_PATH = path.join(__dirname, 'control.json');
const conversaLogPath = path.join(__dirname, 'logs', 'conversas.log');
const leadsLogPath = path.join(__dirname, 'logs', 'leads.log');

// ========================================
// CLIENTE WHATSAPP — GAIVOTTO DEMO
// ========================================

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'gaivotto-demo'
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
            '--single-process',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-features=CertificateTransparencyComponentUpdater'
        ]
    }
});

require('./qrcode-safe')(client);

// ========================================
// ERROS GLOBAIS
// ========================================

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// ========================================
// CONTROLE DO DASHBOARD
// ========================================

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

// ========================================
// LOGS
// ========================================

function mascararTextoSensivel(texto = '') {
    return String(texto)
        .replace(/senha\s*[:=]\s*\S+/gi, 'senha: [OCULTA]')
        .replace(/[\w.-]+\.pfx/gi, '[ARQUIVO PFX OCULTO]')
        .replace(/\b\d{11,14}\b/g, '[DOCUMENTO OCULTO]');
}

async function obterNomeContato(message) {
    try {
        const contato = await message.getContact();
        return contato.pushname || contato.name || contato.shortName || 'Sem nome';
    } catch {
        return 'Sem nome';
    }
}

async function registrarConversaLimpa(message, origem, texto) {
    try {
        fs.mkdirSync(path.dirname(conversaLogPath), { recursive: true });

        const nome = await obterNomeContato(message);
        const id = message.from || 'sem-id';
        const textoSeguro = mascararTextoSensivel(texto);

        const linha = `
[${new Date().toLocaleString('pt-BR')}] ${origem}
Nome: ${nome}
Contato/ID: ${id}
Mensagem: ${textoSeguro}
`;

        fs.appendFileSync(conversaLogPath, linha, 'utf8');
    } catch (error) {
        console.error('Erro ao registrar conversa:', error.message);
    }
}

async function registrarLeadInteressado(message, textoCliente, respostaAna) {
    try {
        fs.mkdirSync(path.dirname(leadsLogPath), { recursive: true });

        const nome = await obterNomeContato(message);

        const linha = `
🔥 LEAD INTERESSADO

Data: ${new Date().toLocaleString('pt-BR')}
Nome: ${nome}
Contato/ID: ${message.from}

Mensagem do cliente:
${mascararTextoSensivel(textoCliente)}

Resposta da Ana:
${mascararTextoSensivel(respostaAna)}

━━━━━━━━━━━━━━━━━━━━
`;

        fs.appendFileSync(leadsLogPath, linha, 'utf8');
        console.log('🔥 Lead interessado registrado.');
    } catch (error) {
        console.error('Erro ao registrar lead:', error.message);
    }
}


async function notificarLeadInteressado(message, textoCliente, respostaAna) {
    try {
        if (!grupoLeads) {
            console.log('Grupo de leads não configurado.');
            return;
        }

        const nome = await obterNomeContato(message);

        const aviso = `🔥 NOVO LEAD INTERESSADO — GAIVOTTO STUDIO

👤 Nome:
${nome}

📱 Contato/ID:
${message.from}

━━━━━━━━━━━━━━━

Mensagem do cliente:
${mascararTextoSensivel(textoCliente)}

━━━━━━━━━━━━━━━

Resposta da Ana:
${mascararTextoSensivel(respostaAna)}

━━━━━━━━━━━━━━━

A pessoa demonstrou interesse no assistente virtual.
Assuma a conversa quando possível.`;

        await client.sendMessage(grupoLeads, aviso);
        console.log('🔥 Lead enviado ao grupo.');

    } catch (error) {
        console.error('Erro ao notificar lead interessado:', error.message);
    }
}

// ========================================
// SIMULAR DIGITAÇÃO
// ========================================

async function iniciarDigitando(message) {
    let chat = null;
    let intervalo = null;
    let timeout = null;
    let parado = false;

    try {
        chat = await message.getChat();

        await chat.sendStateTyping();

        intervalo = setInterval(async () => {
            try {
                if (!parado && chat) {
                    await chat.sendStateTyping();
                }
            } catch {}
        }, 7000);

        timeout = setTimeout(async () => {
            await pararDigitando();
        }, 60000);

        async function pararDigitando() {
            if (parado) return;

            parado = true;

            if (intervalo) clearInterval(intervalo);
            if (timeout) clearTimeout(timeout);

            try {
                if (chat) {
                    await chat.clearState();
                }
            } catch {}
        }

        return pararDigitando;
    } catch {
        return async () => {};
    }
}

// ========================================
// QR CODE NO TERMINAL
// ========================================

client.on('qr', (qr) => {
    console.log('📲 Escaneie o QR Code da Gaivotto Studio:\n');
    qrcode.generate(qr, { small: true });
});

// ========================================
// READY
// ========================================

client.on('ready', async () => {
    console.log('🤖 Bot Gaivotto Studio conectado!');
    console.log('🚀 Demo ativa!\n');
});

// ========================================
// MENSAGENS
// ========================================

client.on('message', async (message) => {
    let pararDigitando = async () => {};

    try {
        if (message.fromMe) return;
        if (!message.from) return;
        if (message.from === 'status@broadcast') return;
        if (message.from.endsWith('@newsletter')) return;
        if (message.from.endsWith('@g.us')) return;
        if (!message.body || !message.body.trim()) return;

        if (
            !message.from.endsWith('@c.us') &&
            !message.from.endsWith('@lid')
        ) return;

        const textoCliente = message.body.trim();

        await registrarConversaLimpa(message, 'CLIENTE', textoCliente);

        // Se o dashboard estiver em modo humano, registra, mas não responde.
        if (!atendimentoAutomaticoAtivo()) {
            await registrarConversaLimpa(
                message,
                'SISTEMA',
                'Modo humano ativo. A Ana Demo não respondeu automaticamente.'
            );

            console.log('Modo humano ativo. Demo não respondeu automaticamente.');
            return;
        }

        pararDigitando = await iniciarDigitando(message);

        let respostaAna = await falarComAna(
            message.from,
            textoCliente
        );

        if (!respostaAna) {
            respostaAna = 'Tive uma instabilidade momentânea no atendimento. Pode tentar novamente em instantes?';
        }

        const textoLead = textoCliente.toLowerCase();

        const leadInteressado =
            respostaAna.includes('[[LEAD_INTERESSADO]]') ||
            respostaAna.includes('[[CHAMAR_ATENDENTE]]') ||
            /tenho interesse|tenho interesse sim|encaminhe|encaminhar|quero contratar|como contratar|pre[cç]o|valor|mensalidade|falar com o gustavo|falar com gustavo|chama o gustavo|pode me chamar|quero uma demonstra[cç][aã]o|quero uma demo/i.test(textoLead);

        respostaAna = respostaAna
            .replace(/\[\[LEAD_INTERESSADO\]\]/g, '')
            .replace(/\[\[CHAMAR_ATENDENTE\]\]/g, '')
            .trim();

        if (respostaAna) {
            await registrarConversaLimpa(message, 'ANA', respostaAna);

            await enviar(
                client,
                message.from,
                respostaAna
            );
        }

        if (leadInteressado) {
            await registrarLeadInteressado(message, textoCliente, respostaAna);
            await notificarLeadInteressado(message, textoCliente, respostaAna);
        }

    } catch (err) {
        console.error('❌ Erro geral na demo:', err);
    } finally {
        await pararDigitando();
    }
});

// ========================================
// START
// ========================================

console.log('🚀 Iniciando bot Gaivotto Studio Demo...');

client.initialize();
