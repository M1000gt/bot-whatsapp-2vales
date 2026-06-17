const qrcode =
require('qrcode-terminal');
const {
    Client,
    LocalAuth,
    MessageMedia
} = require('whatsapp-web.js');
const enviar =
require('./Utils/enviar');

const menu =
require('./Mensagens/menu');

const horarios =
require('./Mensagens/horarios');

const localizacao =
require('./Mensagens/localizacao');

const reservaModelo =
require('./Mensagens/reservaModelo');

const {
    grupoReservas,
    caminhoCardapio
} = require('./config/config');
const{
    falarComAna
} = require('./ana/Ana')
// ========================================
// CLIENT (VPS STABLE MODE)
// ========================================

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'bot2vales' // 👈 EVITA CONFLITO DE SESSÃO NO PM2
    }),

    puppeteer: {
        headless: false,
        //executablePath: '/usr/bin/chromium-browser',
        executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',

 

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            //'--no-zygote',
            //'--single-process'
        ]
    },

   // webVersionCache: {
        //type: 'local'
    //}
});

// ========================================
// ERROS GLOBAIS
// ========================================

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// ========================================
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
    ]

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
                console.log('GRUPO:', chat.name || 'SEM NOME');
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
           await enviar(
    client,
    message.from,
    menu()
);
            return;
        }

        // CARDÁPIO
        if (msg === '1') {
            const media = MessageMedia.fromFilePath(caminhoCardapio);

            await enviar(
                client,
                message.from, 
                media, {
                caption: '📋 Segue o nosso cardápio oficial do 2Valles Restaurante!'
            });

            return;
        }

        // HORÁRIOS
       if (msg === '2') {

    await enviar(
    client,
    message.from,
    horarios
);

    return;
}

// RESERVAS
// ========================================

if (msg === '3') {

 await enviar(
    client,
    message.from,
    reservaModelo
);

    return;
}

// ========================================
// CAPTURA RESERVA
// ========================================

if (

    msg.includes('nome') &&
    (
        msg.includes('data') ||
        msg.includes('horário') ||
        msg.includes('horario')
    )

) {

    // ENVIA PARA O GRUPO
    await enviar(
        client,
        grupoReservas,

`📅 NOVA RESERVA RECEBIDA

👤 Cliente:
${message._data?.notifyName || 'Não informado'}

📱 Número:
${message.from}

━━━━━━━━━━━━━━━

${message.body}`
    );

    // CONFIRMAÇÃO CLIENTE
    await enviar(
        client,
        message.from,

`✅ Reserva recebida com sucesso!

Agradecemos o contato com o 2Valles Restaurante. 🍷

Sua solicitação já foi encaminhada para nossa equipe e em breve confirmaremos sua reserva.

Será um prazer receber você!`
    );

    return;
}

      // LOCALIZAÇÃO
        // ========================================

        if (msg === '4') {
            await enviar(
    client,
    message.from,
    localizacao
      );
            return;
        }

        // ATENDENTE
        if (msg === '5') {
            await enviar(
            client,
            message.from, '👨‍💼 Um atendente ja virá atendelo.');
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