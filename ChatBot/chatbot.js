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
const { atendimentoHumanoAtivo } = require('./Utils/handoffHumano');

const { registrarLogMensal } = require('./Utils/logMensal');
const { interpretarRespostaAna } = require('../core/utils/acoesAna');
const { classificarMensagem2Vales } = require('../core/utils/classificador2Vales');
const { criarFilaPorChave } = require('../core/utils/filaPorChave');
const { mascararDadosSensiveis } = require('../core/utils/mascararDadosSensiveis');

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
        clientId: process.env.WWEBJS_CLIENT_ID || 'bot2vales'
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
const filaMensagens = criarFilaPorChave();
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


const mascararTextoSensivel = mascararDadosSensiveis;

async function registrarConversaLimpa(message, origem, texto) {
    try {
        fsLog.mkdirSync(pathLog.dirname(conversaLogPath), { recursive: true });

        let nome = 'Sem nome';

        try {
            const contato = await message.getContact();
            nome = contato.pushname || contato.name || contato.shortName || 'Sem nome';
        } catch {}

        const id = mascararTextoSensivel(message.from || 'sem-id');
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
    return classificarMensagem2Vales(texto).bloquearResposta;
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
        throw error;
    }
}



// ========================================
// SIMULAR DIGITAÇÃO
// ========================================

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
    let renovacaoEmAndamento = null;
    let parado = false;

    const primeiraTentativa = await tentarEnviarDigitando(chatId);

    if (primeiraTentativa.ok) {
        console.log(`⌨️ Digitando iniciado para ${chatId} via ${primeiraTentativa.metodo}`);

        intervalo = setInterval(() => {
            if (parado || renovacaoEmAndamento) return;

            renovacaoEmAndamento = tentarEnviarDigitando(chatId)
                .then((novaTentativa) => {
                    if (novaTentativa.ok) {
                        console.log(`⌨️ Digitando renovado para ${chatId} via ${novaTentativa.metodo}`);
                    } else {
                        console.log(`⚠️ Não consegui renovar digitando para ${chatId}: ${novaTentativa.erro}`);
                    }
                })
                .catch((error) => {
                    console.log(`⚠️ Erro ao renovar digitando para ${chatId}: ${error.message}`);
                })
                .finally(() => {
                    renovacaoEmAndamento = null;
                });
        }, 7000);
    } else {
        console.log(`⚠️ Não consegui iniciar digitando para ${chatId}: ${primeiraTentativa.erro}`);
    }

    return async function pararDigitando() {
        if (parado) return;

        parado = true;

        if (intervalo) {
            clearInterval(intervalo);
        }

        // Uma renovação iniciada pouco antes da parada poderia religar o
        // estado de digitação. Aguarde-a terminar e só então limpe o estado.
        if (renovacaoEmAndamento) {
            try {
                await renovacaoEmAndamento;
            } catch (_) {}
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



// ========================================
// DELIVERY — CONTEXTO E AVISO AO GRUPO
// ========================================

const contextosDeliveryAtivos = new Map();
const avisosDeliveryRecentes = new Map();

function normalizarTextoDelivery(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function textoIniciaDelivery(texto = '') {
    const msg = normalizarTextoDelivery(texto);

    return /\b(delivery|entrega|entregar|para entrega|pra entrega|pedido para entrega|pedido pra entrega|pedido para entregar|pedido pra entregar|para viagem|pra viagem|fazer um pedido|fazer pedido)\b/i.test(msg);
}

function textoTemItensDePedido(texto = '') {
    const msg = normalizarTextoDelivery(texto);

    return /\b(file|filet|framboises|naranjita|roesti|batata|arroz|pure|puree|massa|prato|acompanhamento|quantidade|dividido|ao ponto|mal passado|bem passado|ossobuco|polpetone|salmao|peixe|carne)\b/i.test(msg);
}

function marcarContextoDelivery(chatId) {
    contextosDeliveryAtivos.set(chatId, Date.now());

    setTimeout(() => {
        const marcadoEm = contextosDeliveryAtivos.get(chatId);
        if (marcadoEm && Date.now() - marcadoEm >= 15 * 60 * 1000) {
            contextosDeliveryAtivos.delete(chatId);
        }
    }, 15 * 60 * 1000);
}

function contextoDeliveryAtivo(chatId) {
    const marcadoEm = contextosDeliveryAtivos.get(chatId);
    if (!marcadoEm) return false;

    if (Date.now() - marcadoEm > 15 * 60 * 1000) {
        contextosDeliveryAtivos.delete(chatId);
        return false;
    }

    return true;
}

async function notificarPedidoDelivery(message, textoCliente, respostaAna) {
    try {
        const chave = `${message.from}:${textoCliente}`.slice(0, 500);

        if (avisosDeliveryRecentes.has(chave)) {
            console.log('🛵 Aviso delivery duplicado ignorado:', message.from);
            return;
        }

        avisosDeliveryRecentes.set(chave, Date.now());

        setTimeout(() => {
            avisosDeliveryRecentes.delete(chave);
        }, 60 * 1000);

        const contato = await message.getContact();
        const nome = contato.pushname || contato.name || 'Cliente';

        const aviso = `🛵 NOVO PEDIDO DELIVERY — 2VALES

👤 Cliente:
${nome}

📱 Contato/ID:
${message.from}

━━━━━━━━━━━━━━━

Mensagem recebida:
${textoCliente}

━━━━━━━━━━━━━━━

Resumo da Ana:
${respostaAna}

━━━━━━━━━━━━━━━

⚠️ A equipe deve confirmar:
- disponibilidade do prato;
- taxa de entrega;
- tempo de entrega;
- localidade/área;
- forma de pagamento;
- fechamento do pedido.`;

        await client.sendMessage(grupoReservas, aviso);
        console.log('🛵 Pedido delivery enviado ao grupo:', message.from);

        contextosDeliveryAtivos.delete(message.from);
    } catch (error) {
        console.error('Erro ao notificar pedido delivery:', error.message);
        throw error;
    }
}



// ========================================
// HANDOFF AUTOMÁTICO POR RESPOSTA HUMANA
// ========================================

const handoffAutomaticoConversas = new Map();
const handoffMensagensBotIds = new Set();
const handoffMensagensBotRecentes = new Map();
const TEMPO_HANDOFF_AUTOMATICO_MS = 30 * 60 * 1000;

function handoffNormalizarConteudo(conteudo) {
    if (typeof conteudo === 'string') {
        return conteudo.trim().slice(0, 1000);
    }

    return '[MIDIA_OU_CONTEUDO_NAO_TEXTO]';
}

function handoffChaveMensagem(chatId, conteudo) {
    return `${chatId}|${handoffNormalizarConteudo(conteudo)}`;
}

// Marca mensagens enviadas pelo próprio BOT, para não confundir com atendente humano.
if (!client.__sendMessageOriginalHandoff) {
    client.__sendMessageOriginalHandoff = client.sendMessage.bind(client);

    client.sendMessage = async function(chatId, conteudo, options) {
        const chave = handoffChaveMensagem(chatId, conteudo);

        handoffMensagensBotRecentes.set(chave, Date.now());

        setTimeout(() => {
            handoffMensagensBotRecentes.delete(chave);
        }, 30000);

        const mensagemEnviada = await client.__sendMessageOriginalHandoff(chatId, conteudo, options);

        try {
            if (mensagemEnviada && mensagemEnviada.id && mensagemEnviada.id._serialized) {
                handoffMensagensBotIds.add(mensagemEnviada.id._serialized);

                setTimeout(() => {
                    handoffMensagensBotIds.delete(mensagemEnviada.id._serialized);
                }, 5 * 60 * 1000);
            }
        } catch (_) {}

        return mensagemEnviada;
    };
}

function mensagemFoiEnviadaPeloBot(message) {
    try {
        if (message && message.id && message.id._serialized && handoffMensagensBotIds.has(message.id._serialized)) {
            return true;
        }

        const chatId = message.to || message.from;

        // Mídias enviadas pelo bot são registradas com um marcador genérico.
        // Por isso, na comparação, não usamos o body/nome do arquivo.
        const conteudoParaComparar = message.hasMedia
            ? null
            : (message.body || '');

        const chave = handoffChaveMensagem(chatId, conteudoParaComparar);

        return handoffMensagensBotRecentes.has(chave);
    } catch (_) {
        return false;
    }
}

function registrarHandoffAutomatico(chatId) {
    if (!chatId) return;

    const expiraEm = Date.now() + TEMPO_HANDOFF_AUTOMATICO_MS;

    handoffAutomaticoConversas.set(chatId, expiraEm);

    console.log(`👤 Handoff automático ativado para ${chatId} por 30 minutos.`);
}

function handoffAutomaticoAtivo(chatId) {
    const expiraEm = handoffAutomaticoConversas.get(chatId);

    if (!expiraEm) return false;

    if (Date.now() > expiraEm) {
        handoffAutomaticoConversas.delete(chatId);
        console.log(`✅ Handoff automático expirou para ${chatId}.`);
        return false;
    }

    return true;
}

// Detecta mensagem enviada manualmente pelo WhatsApp da empresa.
// Mensagens enviadas pelo próprio bot são ignoradas.
client.on('message_create', async (message) => {
    try {
        if (!message.fromMe) return;

        const chatId = message.to;

        if (!chatId) return;
        if (chatId === 'status@broadcast') return;
        if (chatId.endsWith('@g.us')) return;
        if (chatId.endsWith('@newsletter')) return;

        if (
            !chatId.endsWith('@c.us') &&
            !chatId.endsWith('@lid')
        ) return;

        if (mensagemFoiEnviadaPeloBot(message)) {
            console.log(
                `🤖 Envio automático ignorado pelo handoff: ${chatId}` +
                (message.hasMedia ? ' [mídia]' : '')
            );
            return;
        }

        registrarHandoffAutomatico(chatId);

        try {
            await registrarConversaLimpa(
                { ...message, from: chatId },
                'ATENDENTE HUMANO',
                message.body || '[mensagem sem texto / mídia]'
            );
        } catch (_) {}
    } catch (error) {
        console.error('Erro no handoff automático:', error.message);
    }
});


async function processarMensagemRecebida(message) {
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
    let pararDigitando = null;

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

          if (textoIniciaDelivery(message.body)) {
              marcarContextoDelivery(message.from);
          }

        await registrarConversaLimpa(message, 'CLIENTE', message.body.trim());

        if (atendimentoHumanoAtivo(message.from) || handoffAutomaticoAtivo(message.from)) {
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

        pararDigitando = await iniciarDigitando(message);

        const respostaOriginalAna = await falarComAna(
            message.from,
            message.body
        );

        const resultadoAna = interpretarRespostaAna(respostaOriginalAna);
        const respostaAna = resultadoAna.textoCliente;
        const { acoes } = resultadoAna;

        const deveEnviarCardapio = acoes.enviarCardapio;
        const deveEnviarLocalizacao = acoes.enviarLocalizacao;
        const deveChamarAtendente = acoes.chamarAtendente;

        const deveNotificarDelivery =
            acoes.pedidoDelivery ||
            (
                contextoDeliveryAtivo(message.from) &&
                textoTemItensDePedido(message.body || '') &&
                /(encaminh|confirm|pedido|delivery|entrega|equipe)/i.test(respostaAna)
            );

        // As ações internas acontecem antes da confirmação ao cliente.
        // Se o grupo não receber, o fluxo falha em vez de afirmar um encaminhamento inexistente.
        if (deveNotificarDelivery) {
            await notificarPedidoDelivery(message, message.body.trim(), respostaAna);
        }

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

        if (acoes.reservaCompleta) {
            const dadosReserva = acoes.dadosReserva;

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

        // O indicador deve desaparecer antes da primeira resposta visível.
        // Uploads de PDF ou outras ações posteriores não devem mantê-lo ativo.
        if (pararDigitando) {
            await pararDigitando();
            pararDigitando = null;
        }

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

    } catch (err) {
        console.error('❌ Erro geral:', err);
    } finally {
        if (pararDigitando) {
            await pararDigitando();
        }
    }
}

client.on('message', (message) => {
    const chatId = message && message.from;

    if (!chatId) return;

    filaMensagens.executar(chatId, () => processarMensagemRecebida(message))
        .catch(error => {
            console.error('❌ Erro na fila da conversa:', error.message);
        });
});

// ========================================
// START
// ========================================

console.log('🚀 Iniciando bot...');

client.initialize();
