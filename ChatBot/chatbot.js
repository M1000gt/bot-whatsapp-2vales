const qrcode =
require('qrcode-terminal');
const {
    Client,
    LocalAuth,
    MessageMedia
} = require('whatsapp-web.js');
const enviar =
require('./Utils/enviar');

const { atendimentoAutomaticoAtivo } = require('./Utils/controleAtendimento');
const { registrarEnvioAutomatico, processarMensagemEnviadaPeloNumero, atendimentoHumanoAtivo } = require('./Utils/handoffHumano');

const { registrarLogMensal } = require('./Utils/logMensal');

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
        

 

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            //'--no-zygote',
            //'--single-process'
        ]
    },


});

require('./qrcode-safe')(client);

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


// ========================================
// LOG LIMPO DE CONVERSAS
// ========================================

const fsLog = require('fs');
const pathLog = require('path');

const conversaLogPath = pathLog.join(__dirname, 'logs', 'conversas.log');

function dataHoraBrasil() {
    const partes = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(new Date());

    const mapa = {};

    for (const parte of partes) {
        if (parte.type !== 'literal') {
            mapa[parte.type] = parte.value;
        }
    }

    return `${mapa.day}/${mapa.month}/${mapa.year}, ${mapa.hour}:${mapa.minute}:${mapa.second}`;
}


function mascararTextoSensivel(texto = '') {
    return String(texto)
        .replace(/senha\s*[:=]\s*\S+/gi, 'senha: [OCULTA]')
        .replace(/[\w.-]+\.pfx/gi, '[ARQUIVO PFX OCULTO]')
        .replace(/\b\d{14}\b/g, '[CNPJ/CPF OCULTO]');
}

async function registrarConversaLimpa(message, origem, texto) {
    try {
        fsLog.mkdirSync(pathLog.dirname(conversaLogPath), { recursive: true });

        let nome = 'Sem nome';

        try {
            const contato = await message.getContact();
            nome = contato.pushname || contato.name || contato.shortName || 'Sem nome';
        } catch {}

        const id = message.from || 'sem-id';
        const textoSeguro = mascararTextoSensivel(texto);

        const linha = `
[${dataHoraBrasil()}] ${origem}
Nome: ${nome}
Contato/ID: ${id}
Mensagem: ${textoSeguro}
`;

        fsLog.appendFileSync(conversaLogPath, linha, 'utf8');
        registrarLogMensal('conversas', linha);
    } catch (error) {
        console.error('Erro ao registrar conversa limpa:', error.message);
    }
}



// ========================================
// FILTRO ADMINISTRATIVO / FORNECEDORES
// ========================================

function pareceMensagemAdministrativa(texto = '') {
    const t = String(texto).toLowerCase();

    const padroes = [
        /promo[cç][aã]o\s+de\s+(carne|carnes|bebida|bebidas|heineken|cerveja|vinho|frango|peixe|pescado)/i,
        /(carne|bebida|heineken|cerveja|vinho|frango|peixe|pescado).*(promo[cç][aã]o|semana|entrega|fornecedor|or[cç]amento)/i,
        /fornecedor/i,
        /contador|contabilidade|fiscal|imposto/i,
        /nota\s*fiscal|nf-e|nfe|danfe|xml/i,
        /boleto|cobran[cç]a|pagamento|pix/i,
        /certificado|\.pfx|senha/i,
        /mercadoria|produto\s+para\s+venda|or[cç]amento/i,
        /entrego|entrega|entregar|retirada/i,
        /vamos\s+precisar/i,
        /precisam\s+de\s+mais\s+alguma\s+coisa/i,
        /as\s+notinhas/i,
        /total\s+r?\$?\s*\d+/i,
        /segue\s+(arquivo|nota|boleto|certificado|xml|danfe)/i
    ];

    return padroes.some(regex => regex.test(t));
}

async function notificarAdministrativo(message, texto) {
    try {
        let nome = 'Sem nome';

        try {
            const contato = await message.getContact();
            nome = contato.pushname || contato.name || contato.shortName || 'Sem nome';
        } catch {}

        const aviso = `📌 MENSAGEM ADMINISTRATIVA / FORNECEDOR

👤 Nome:
${nome}

📱 Contato/ID:
${message.from}

━━━━━━━━━━━━━━━

Mensagem recebida:
${texto}

━━━━━━━━━━━━━━━

A Ana não respondeu esse contato. Mensagem encaminhada para a equipe responsável.`;

        await client.sendMessage(grupoReservas, aviso);
    } catch (error) {
        console.error('Erro ao notificar administrativo:', error.message);
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
// CACHE DO CARDÁPIO
// ========================================

let mediaCardapioCache = null;

function getMediaCardapio() {
    if (!mediaCardapioCache) {
        mediaCardapioCache = MessageMedia.fromFilePath(caminhoCardapio);
        console.log('📄 Cardápio carregado em cache.');
    }

    return mediaCardapioCache;
}


client.on('message', async (message) => {
        if (message.fromMe) return;
        if (!message.from) return;
        if (message.from === 'status@broadcast') return;
        if (!atendimentoAutomaticoAtivo()) {
           console.log('⏸️ Atendimento automático pausado pelo painel. Mensagem ignorada:', message.from);
               return;
   }
        if (message.from.endsWith('@newsletter')) return;
        if (message.from.endsWith('@g.us')) return;
        if (!message.body || !message.body.trim()) return;
    try {
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

        await registrarConversaLimpa(message, 'CLIENTE', message.body.trim());

        if (atendimentoHumanoAtivo(message.from)) {
            await registrarConversaLimpa(message, 'SISTEMA', 'Atendimento humano ativo nesta conversa. Ana não respondeu para não falar por cima da equipe.');
            console.log('👤 Atendimento humano ativo. Ana não respondeu:', message.from);
            return;
        }

        if (pareceMensagemAdministrativa(msg)) {
            await registrarConversaLimpa(message, 'ADMIN/FORNECEDOR BLOQUEADO', msg);
            await notificarAdministrativo(message, msg);
            return;
        }

        // ========================================
        // ANA COMO CÉREBRO PRINCIPAL
        // ========================================

        const pararDigitando = await iniciarDigitando(message);

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
            await registrarConversaLimpa(message, 'ANA', respostaAna);
            await enviar(
                client,
                message.from,
                respostaAna
            );
        }

        await pararDigitando();

        // ========================================
        // ENVIA CARDÁPIO SE A ANA PEDIR
        // ========================================

        if (deveEnviarCardapio) {
            const media = getMediaCardapio();

            await enviar(
                client,
                message.from,
                media,
                {
                    caption: '📋 Segue o nosso cardápio oficial do 2Vales Restaurante!'
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
