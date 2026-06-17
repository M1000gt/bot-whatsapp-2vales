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
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        //executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',

 

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
const modoAna = {};
const ultimaReservaEnviada = {};
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

   // try {
       // const chats = await client.getChats();

        //console.log('📋 GRUPOS ENCONTRADOS:\n');

       // chats.forEach(chat => {
          //  if (chat.isGroup) {
              //  console.log('-------------------------');
               // console.log('GRUPO:', chat.name || 'SEM NOME');
               // console.log('ID:', chat.id._serialized);
           // }
      //  });

   // } catch (err) {
        //console.error('❌ Erro grupos:', err);
   // }
});


// ========================================
// MENSAGENS
// ========================================

client.on('message', async (message) => {
    try {
         console.log('🔎 RECEBI ALGO DE:', message.from, '| fromMe:', message.fromMe);
        if (!message.body) return;

        // Ignora mensagens enviadas pelo próprio bot
        if (message.fromMe) return;

        // Ignora grupos
        if (message.from.includes('@g.us')) return;

      // Aceita conversas individuais normais e contatos novos do WhatsApp
      if (
    !message.from.endsWith('@c.us') &&
    !message.from.endsWith('@lid')
      ) return;

        const msg = message.body.toLowerCase().trim();

        console.log('📩 Mensagem:', msg);

        // ========================================
        // ANA COMO CÉREBRO PRINCIPAL
        // ========================================

        let respostaAna = await falarComAna(
            message.from,
            message.body
        );

        // ========================================
        // MARCADORES DE AÇÃO
        // ========================================

        const deveEnviarCardapio =
            respostaAna.includes('[[ENVIAR_CARDAPIO]]');

        const deveEnviarLocalizacao =
            respostaAna.includes('[[ENVIAR_LOCALIZACAO]]');

        const deveChamarAtendente =
            respostaAna.includes('[[CHAMAR_ATENDENTE]]');

        const reservaMatch = respostaAna.match(
            /\[\[RESERVA_COMPLETA\]\]([\s\S]*?)\[\[\/RESERVA_COMPLETA\]\]/
        );

        // ========================================
        // REMOVE MARCADORES DA RESPOSTA AO CLIENTE
        // ========================================

        respostaAna = respostaAna
            .replace(/\[\[ENVIAR_CARDAPIO\]\]/g, '')
            .replace(/\[\[ENVIAR_LOCALIZACAO\]\]/g, '')
            .replace(/\[\[CHAMAR_ATENDENTE\]\]/g, '')
            .replace(
                /\[\[RESERVA_COMPLETA\]\]([\s\S]*?)\[\[\/RESERVA_COMPLETA\]\]/g,
                ''
            )
            .trim();

        // ========================================
        // ENVIA RESPOSTA DA ANA AO CLIENTE
        // ========================================

        if (respostaAna) {
            await enviar(
                client,
                message.from,
                respostaAna
            );
        }

        // ========================================
        // ENVIA CARDÁPIO SE A ANA PEDIR
        // ========================================

        if (deveEnviarCardapio) {
            const media = MessageMedia.fromFilePath(caminhoCardapio);

            await enviar(
                client,
                message.from,
                media,
                {
                    caption: '📋 Segue o nosso cardápio oficial do 2Valles Restaurante!'
                }
            );
        }

        // ========================================
        // ENVIA LOCALIZAÇÃO SE A ANA PEDIR
        // ========================================

        if (deveEnviarLocalizacao) {
            await enviar(
                client,
                message.from,
                localizacao
            );
        }

        // ========================================
        // AVISA O GRUPO SE PEDIR ATENDENTE
        // ========================================

        if (deveChamarAtendente) {
            await enviar(
                client,
                grupoReservas,
`👨‍💼 CLIENTE SOLICITOU ATENDIMENTO HUMANO

👤 Cliente:
${message._data?.notifyName || 'Não informado'}

📱 Número:
${message.from}

━━━━━━━━━━━━━━━

Mensagem do cliente:
${message.body}`
            );
        }

        // ========================================
        // ENVIA RESERVA PARA O GRUPO
        // ========================================

        if (reservaMatch) {
            const dadosReserva = reservaMatch[1].trim();

            await enviar(
                client,
                grupoReservas,
`📅 NOVA SOLICITAÇÃO DE RESERVA VIA ANA

👤 Cliente:
${message._data?.notifyName || 'Não informado'}

📱 Número:
${message.from}

━━━━━━━━━━━━━━━

${dadosReserva}`
            );
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