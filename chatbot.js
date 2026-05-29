const qrcode = require('qrcode-terminal');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// ========================================
// CONFIGURAÇÕES
// ========================================

const grupoReservas = '120363413884817037@g.us';
const caminhoCardapio = './cardapio.PDF.pdf';

// ========================================
// CLIENT (VPS STABLE MODE)
// ========================================

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'bot2vales' // 👈 EVITA CONFLITO DE SESSÃO NO PM2
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
            await enviar(message.from, `
${saudacao()}

🍽️ Seja muito bem-vindo ao atendimento virtual do 2Valles Restaurante!

Escolha uma das opções abaixo:

1️⃣ Cardápio
2️⃣ Horários
3️⃣ Reservas
4️⃣ Localização
5️⃣ Falar com atendente

Digite apenas o número da opção desejada.`
        );
            return;
        }

        // CARDÁPIO
        if (msg === '1') {
            const media = MessageMedia.fromFilePath(caminhoCardapio);

            await enviar(message.from, media, {
                caption: '📋 Segue o nosso cardápio oficial do 2Valles Restaurante!'
            });

            return;
        }

        // HORÁRIOS
        if (msg === '2') {
            await enviar(message.from, 
`⏰ HORÁRIOS DE FUNCIONAMENTO

Quarta e Quinta:
12h às 22h

Sexta e Sábado:
12h às 23h

Domingo:
12h às 17h`
        );
            return;
        }

// RESERVAS
// ========================================

if (msg === '3') {

    await enviar(
        message.from,

`📅 RESERVAS 2VALLES

Copie o modelo abaixo, preencha e envie para concluirmos sua reserva:

━━━━━━━━━━━━━━━

Nome:
Data:
Horário:
Quantidade de pessoas:
Ambiente desejado:

━━━━━━━━━━━━━━━

🍷 Ambiente interno Bistrô
🌿 Ambiente externo próximo ao jardim`
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

                message.from,

`📍 LOCALIZAÇÃO

Estrada Ministro Salgado Filho, 255
Vale da Boa Esperança
Petrópolis - RJ

📞 24 2222-0753

https://maps.app.goo.gl/LTi232DwnLwsigX79`

            );

            return;
        }

        // ATENDENTE
        if (msg === '5') {
            await enviar(message.from, '👨‍💼 Um atendente ja virá atendelo.');
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