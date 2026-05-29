const qrcode = require('qrcode-terminal');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// ========================================
// CONFIGURAÇÕES
// ========================================

const grupoReservas = '120363413884817037@g.us';
const caminhoCardapio = './cardapio.pdf.pdf';

// ========================================
// CLIENT (VERSÃO ESTÁVEL)
// ========================================

const client = new Client({

    authStrategy: new LocalAuth(),

    puppeteer: {

        headless: true,

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
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
    return new Promise(res => setTimeout(res, ms));
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
    'bom dia', 'boa tarde', 'boa noite'
];

// ========================================
// ENVIO SEGURO
// ========================================

async function enviar(destino, msg, opcoes = {}) {
    try {

        if (!client.info) {
            console.log('⏳ Bot ainda iniciando...');
            return;
        }

        await delay(500);

        return await client.sendMessage(destino, msg, opcoes);

    } catch (err) {
        console.error('❌ Erro envio:', err);
    }
}

// ========================================
// QR CODE
// ========================================

client.on('qr', qr => {
    console.log('📲 Escaneie o QR Code:');
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

    } catch (err) {
        console.error('❌ Erro ao listar grupos:', err);
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

            await enviar(
                message.from,
`${saudacao()}

🍽️ *2Valles Restaurante*

1️⃣ Cardápio
2️⃣ Horários
3️⃣ Reservas
4️⃣ Localização
5️⃣ Atendente`
            );

            return;
        }

        // CARDÁPIO
        if (msg === '1') {

            try {

                const media = MessageMedia.fromFilePath(caminhoCardapio);

                await enviar(
                    message.from,
                    media,
                    { caption: '📋 Cardápio 2Valles' }
                );

            } catch (err) {
                console.error(err);

                await enviar(
                    message.from,
                    '❌ Não foi possível enviar o cardápio.'
                );
            }

            return;
        }

        // HORÁRIOS
        if (msg === '2') {

            await enviar(
                message.from,
`⏰ HORÁRIOS

Quarta e Quinta: 12h às 22h
Sexta e Sábado: 12h às 23h
Domingo: 12h às 17h`
            );

            return;
        }

        // RESERVAS
        if (msg === '3') {

            await enviar(
                message.from,
`📅 RESERVAS

Nome:
Data:
Horário:
Pessoas:
Ambiente:`
            );

            return;
        }

        // CAPTURA RESERVA
        if (
            msg.includes('nome') &&
            (msg.includes('data') || msg.includes('horário') || msg.includes('horario'))
        ) {

            await enviar(
                grupoReservas,
`📅 NOVA RESERVA

Cliente: ${message._data?.notifyName || 'Não informado'}
Número: ${message.from}

${message.body}`
            );

            await enviar(
                message.from,
'✅ Reserva recebida! Em breve entraremos em contato.'
            );

            return;
        }

        // LOCALIZAÇÃO
        if (msg === '4') {

            await enviar(
                message.from,
`📍 LOCALIZAÇÃO

Estrada Ministro Salgado Filho, 255
Petrópolis - RJ`
            );

            return;
        }

        // ATENDENTE
        if (msg === '5') {

            await enviar(
                message.from,
'👨‍💼 Um atendente falará com você em breve.'
            );

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