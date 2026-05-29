const qrcode = require('qrcode-terminal');

const {
    Client,
    LocalAuth,
    MessageMedia
} = require('whatsapp-web.js');

// ========================================
// CONFIGURAÇÕES
// ========================================

const grupoReservas = '120363413884817037@g.us';
const caminhoCardapio = './cardapio.pdf.pdf';

// ========================================
// CLIENT (VERSÃO VPS ESTÁVEL)
// ========================================

const client = new Client({

    authStrategy: new LocalAuth(),

    puppeteer: {

        headless: true,

        executablePath: '/usr/bin/chromium',

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    },

    webVersionCache: {
        type: 'local'
    }
});

// ========================================
// TRATAMENTO GLOBAL DE ERROS
// ========================================

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// ========================================
// FUNÇÃO DELAY
// ========================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// SAUDAÇÃO
// ========================================

function saudacao() {

    const hora = new Date().getHours();

    if (hora >= 5 && hora < 12) return 'Olá, bom dia senhores! ☀️';
    if (hora >= 12 && hora < 18) return 'Olá, boa tarde senhores! 🌤️';
    return 'Olá, boa noite senhores! 🌙';
}

// ========================================
// PALAVRAS MENU
// ========================================

const boasVindas = [
    'oi', 'olá', 'ola', 'menu',
    'bom dia', 'boa tarde', 'boa noite',
    'olá bom dia', 'olá boa tarde', 'olá boa noite',
    'ola bom dia', 'ola boa tarde', 'ola boa noite'
];

// ========================================
// ENVIO SEGURO
// ========================================

async function enviar(destino, mensagem, opcoes = {}) {

    try {

        if (!client.info) {
            console.log('⏳ Bot ainda não está pronto');
            return;
        }

        await delay(500);

        return await client.sendMessage(destino, mensagem, opcoes);

    } catch (erro) {
        console.error('❌ Erro ao enviar mensagem:', erro);
    }
}

// ========================================
// QR CODE
// ========================================

client.on('qr', qr => {
    console.log('📲 Escaneie o QR Code abaixo:\n');
    qrcode.generate(qr, { small: true });
});

// ========================================
// READY
// ========================================

client.on('ready', async () => {

    console.log('🤖 Bot conectado com sucesso!');
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

    } catch (erro) {
        console.error('❌ Erro ao listar grupos:', erro);
    }
});

// ========================================
// MENSAGENS
// ========================================

client.on('message', async message => {

    try {

        if (!message.body) return;

        if (message.from.includes('@g.us')) return;

        const msg = message.body.toLowerCase().trim();

        console.log('📩 Mensagem:', msg);

        // ========================================
        // MENU
        // ========================================

        if (boasVindas.includes(msg)) {

            await enviar(
                message.from,
`${saudacao()}

🍽️ *Bem-vindo ao atendimento virtual do 2Valles Restaurante!*

Escolha uma das opções:

1️⃣ Cardápio
2️⃣ Horários
3️⃣ Reservas
4️⃣ Localização
5️⃣ Falar com atendente`
            );

            return;
        }

        // ========================================
        // CARDÁPIO
        // ========================================

        if (msg === '1') {

            try {

                const media = MessageMedia.fromFilePath(caminhoCardapio);

                await enviar(
                    message.from,
                    media,
                    { caption: '📋 *Cardápio oficial do 2Valles*' }
                );

            } catch (erro) {
                console.error('❌ Erro PDF:', erro);

                await enviar(
                    message.from,
                    '❌ Não foi possível localizar o cardápio.'
                );
            }

            return;
        }

        // ========================================
        // HORÁRIOS
        // ========================================

        if (msg === '2') {

            await enviar(
                message.from,
`⏰ *HORÁRIOS*

Quarta e Quinta: 12h às 22h
Sexta e Sábado: 12h às 23h
Domingo: 12h às 17h`
            );

            return;
        }

        // ========================================
        // RESERVAS
        // ========================================

        if (msg === '3') {

            await enviar(
                message.from,
`📅 *RESERVAS*

Nome:
Data:
Horário:
Quantidade de pessoas:
Ambiente desejado:`
            );

            return;
        }

        // ========================================
        // CAPTURA RESERVA
        // ========================================

        if (
            msg.includes('nome') &&
            (msg.includes('data') || msg.includes('horário') || msg.includes('horario'))
        ) {

            await enviar(
                grupoReservas,
`📅 *NOVA RESERVA*

👤 Cliente: ${message._data?.notifyName || 'Não informado'}
📱 Número: ${message.from}

━━━━━━━━━━━━━━━

${message.body}`
            );

            await enviar(
                message.from,
`✅ *Reserva recebida!*
Em breve entraremos em contato. 🍷`
            );

            return;
        }

        // ========================================
        // LOCALIZAÇÃO
        // ========================================

        if (msg === '4') {

            await enviar(
                message.from,
`📍 *LOCALIZAÇÃO*

Estrada Ministro Salgado Filho, 255
Petrópolis - RJ`
            );

            return;
        }

        // ========================================
        // ATENDENTE
        // ========================================

        if (msg === '5') {

            await enviar(
                message.from,
'👨‍💼 Um atendente falará com você em breve.'
            );

            return;
        }

    } catch (erro) {
        console.error('❌ Erro geral:', erro);
    }

});

// ========================================
// START
// ========================================

console.log('🚀 Iniciando bot...');

client.initialize();