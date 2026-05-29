const qrcode = require('qrcode-terminal');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// ========================================
// CONFIGURAÇÕES
// ========================================

const grupoReservas = '120363413884817037@g.us';
const caminhoCardapio = './cardapio.pdf.pdf';

// ========================================
// CLIENT (VPS STABLE MODE)
// ========================================

const client = new Client({
    authStrategy: new LocalAuth(),

    puppeteer: {
        headless: true,

        executablePath: '/usr/bin/google-chrome', // 👈 ESSENCIAL

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

// ========================================
// ERROS GLOBAIS
// ========================================

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// ========================================
// UTIL
// ========================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function saudacao() {
    const hora = new Date().getHours();

    if (hora < 12) return 'Olá, bom dia senhores! ☀️';
    if (hora < 18) return 'Olá, boa tarde senhores! 🌤️';
    return 'Olá, boa noite senhores! 🌙';
}

// ========================================
// PALAVRAS MENU
// ========================================

const boasVindas = [
    'oi', 'olá', 'ola', 'menu',
    'bom dia', 'boa tarde', 'boa noite',
    'ola bom dia', 'ola boa tarde', 'ola boa noite',
    'olá bom dia', 'olá boa tarde', 'olá boa noite'
];

// ========================================
// ENVIO SEGURO
// ========================================

async function enviar(destino, mensagem, opcoes = {}) {
    try {
        if (!client.info) return;

        await delay(600);

        return await client.sendMessage(destino, mensagem, opcoes);

    } catch (err) {
        console.error('❌ Erro envio:', err);
    }
}

// ========================================
// QR CODE
// ========================================

client.on('qr', (qr) => {
    console.log('📲 Escaneie o QR Code:\n');
    qrcode.generate(qr, { small: true });
});

// ========================================
// READY
// ========================================

client.on('ready', async () => {
    console.log('🤖 Bot conectado!');
    console.log('🚀 Sistema ativo!\n');

    try {
        const chats = await client.getChats();

        console.log('📋 GRUPOS ENCONTRADOS:\n');

        chats.forEach(chat => {
            if (chat.isGroup) {
                console.log('-------------------------');
                console.log('GRUPO:', chat.name);
                console.log('ID:', chat.id._serialized);
            }
        });

    } catch (err) {
        console.error('❌ Erro grupos:', err);
    }
});

// ========================================
// MENSAGENS
// ========================================

client.on('message', async (message) => {
    try {
        if (!message.body) return;
        if (message.from.includes('@g.us')) return;

        const msg = message.body.toLowerCase().trim();

        console.log('📩 Mensagem:', msg);

        // MENU
        if (boasVindas.includes(msg)) {
            await enviar(message.from, `
${saudacao()}

🍽️ *Bem-vindo ao atendimento virtual!*

1️⃣ Cardápio
2️⃣ Horários
3️⃣ Reservas
4️⃣ Localização
5️⃣ Atendente
`);
            return;
        }

        // CARDÁPIO
        if (msg === '1') {
            const media = MessageMedia.fromFilePath(caminhoCardapio);

            await enviar(message.from, media, {
                caption: '📋 Cardápio oficial'
            });

            return;
        }

        // HORÁRIOS
        if (msg === '2') {
            await enviar(message.from, `
⏰ *Horários*

Qua/Qui: 12h–22h
Sex/Sáb: 12h–23h
Dom: 12h–17h
`);
            return;
        }

        // RESERVAS
        if (msg === '3') {
            await enviar(message.from, `
📅 *Reservas*

Nome:
Data:
Horário:
Pessoas:
Ambiente:
`);
            return;
        }

        // CAPTURA RESERVA
        if (msg.includes('nome') && (msg.includes('data') || msg.includes('horario') || msg.includes('horário'))) {

            await enviar(grupoReservas, `
📅 *NOVA RESERVA*

👤 ${message._data?.notifyName || 'N/A'}
📱 ${message.from}

${message.body}
`);

            await enviar(message.from, `
✅ Reserva recebida!
Em breve confirmaremos.
`);

            return;
        }

        // LOCALIZAÇÃO
        if (msg === '4') {
            await enviar(message.from, `
📍 Localização

Petrópolis - RJ
https://maps.google.com
`);
            return;
        }

        // ATENDENTE
        if (msg === '5') {
            await enviar(message.from, '👨‍💼 Um atendente vai te chamar.');
            return;
        }

    } catch (err) {
        console.error('❌ Erro geral:', err);
    }
});

// ========================================
// START
// ========================================

console.log('🚀 Iniciando bot...');

client.initialize();