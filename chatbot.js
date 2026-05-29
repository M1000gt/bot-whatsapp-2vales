const qrcode = require('qrcode-terminal');

const {
    Client,
    LocalAuth,
    MessageMedia
} = require('whatsapp-web.js');

// ========================================
// CONFIGURAÇÕES
// ========================================

// ID DO GRUPO DE RESERVAS
const grupoReservas = '120363407529784204@g.us';

// CAMINHO DO PDF
const caminhoCardapio = './cardapio.pdf.pdf';

// ========================================
// CLIENT
// ========================================

const client = new Client({

    authStrategy: new LocalAuth(),

    puppeteer: {

        headless: false,

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
// ERROS GLOBAIS
// ========================================

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

// ========================================
// DELAY
// ========================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// SAUDAÇÃO AUTOMÁTICA
// ========================================

function saudacao() {

    const hora = new Date().getHours();

    if (hora >= 5 && hora < 12) {
        return 'Olá, bom dia senhores! ☀️';
    }

    if (hora >= 12 && hora < 18) {
        return 'Olá, boa tarde senhores! 🌤️';
    }

    return 'Olá, boa noite senhores! 🌙';
}

// ========================================
// PALAVRAS MENU
// ========================================

const boasVindas = [

    'oi',
    'olá',
    'ola',
    'menu',
    'bom dia',
    'boa tarde',
    'boa noite',
    'olá bom dia',
    'olá boa tarde',
    'olá boa noite',
    'ola bom dia',
    'ola boa tarde',
    'ola boa noite'

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

        await delay(700);

        return await client.sendMessage(
            destino,
            mensagem,
            opcoes
        );

    } catch (erro) {

        console.error('❌ Erro ao enviar mensagem:', erro);

    }
}

// ========================================
// QR CODE
// ========================================

client.on('qr', qr => {

    console.log('📲 Escaneie o QR Code abaixo:\n');

    qrcode.generate(qr, {
        small: true
    });

});

// ========================================
// READY
// ========================================

client.on('ready', async () => {

    console.log('🤖 Bot conectado com sucesso!');
    console.log('🚀 Sistema de reservas ativo!\n');

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

        // IGNORA MENSAGENS VAZIAS
        if (!message.body) return;

        // IGNORA GRUPOS
        if (message.from.includes('@g.us')) return;

        const msg = message.body
            .toLowerCase()
            .trim();

        console.log('📩 Mensagem:', msg);

        // ========================================
        // MENU
        // ========================================

        if (boasVindas.includes(msg)) {

            await enviar(

                message.from,

`${saudacao()}

🍽️ *Bem-vindo ao atendimento virtual do 2Valles Restaurante!*

Escolha uma das opções abaixo:

1️⃣ Cardápio
2️⃣ Horários
3️⃣ Reservas
4️⃣ Localização
5️⃣ Falar com atendente

Digite apenas o número desejado.`
            );

            return;
        }

        // ========================================
        // CARDÁPIO
        // ========================================

        if (msg === '1') {

            try {

                const media =
                    MessageMedia.fromFilePath(caminhoCardapio);

                await enviar(

                    message.from,
                    media,

                    {
                        caption:
                            '📋 *Segue o cardápio oficial do 2Valles Restaurante!*'
                    }

                );

            } catch (erro) {

                console.error('❌ Erro PDF:', erro);

                await enviar(

                    message.from,

                    '❌ Não foi possível localizar o cardápio no momento.'

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

`⏰ *HORÁRIOS DE FUNCIONAMENTO*

Quarta e Quinta:
12h às 22h

Sexta e Sábado:
12h às 23h

Domingo:
12h às 17h`

            );

            return;
        }

        // ========================================
        // RESERVAS
        // ========================================

        if (msg === '3') {

            await enviar(

                message.from,

`📅 *RESERVAS 2VALLES*

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

`📅 *NOVA RESERVA RECEBIDA*

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

`✅ *Reserva recebida com sucesso!*

Agradecemos o contato com o *2Valles Restaurante*. 🍷

Sua solicitação já foi encaminhada para nossa equipe e em breve confirmaremos sua reserva.

Será um prazer receber você!`

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
Vale da Boa Esperança
Petrópolis - RJ

📞 24 2222-0753

https://maps.app.goo.gl/LTi232DwnLwsigX79`

            );

            return;
        }

        // ========================================
        // ATENDENTE
        // ========================================

        if (msg === '5') {

            await enviar(

                message.from,

'👨‍💼 Um atendente falará com você em instantes.'

            );

            return;
        }

    } catch (erro) {

        console.error('❌ Erro geral:', erro);

    }

});

// ========================================
// INICIAR BOT
// ========================================

console.log('🚀 Iniciando chatbot...\n');

client.initialize();