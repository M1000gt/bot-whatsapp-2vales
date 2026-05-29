const { Client, LocalAuth } = require('whatsapp-web.js');

// 🔥 Detecta Chromium automaticamente (mais seguro)
const CHROME_PATH =
  '/usr/bin/chromium-browser';

console.log('🚀 Iniciando bot...');
console.log('🌐 Usando Chromium:', CHROME_PATH);

// ===============================
// CLIENT CONFIG
// ===============================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

// ===============================
// EVENTS
// ===============================
client.on('qr', (qr) => {
  console.log('📱 QR Code recebido, escaneie no WhatsApp!');
});

client.on('ready', () => {
  console.log('🤖 Bot conectado com sucesso!');
  console.log('🚀 Sistema ativo!');
});

client.on('authenticated', () => {
  console.log('🔐 Autenticado com sucesso!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Falha de autenticação:', msg);
});

client.on('disconnected', (reason) => {
  console.error('⚠️ Bot desconectado:', reason);
  console.log('🔄 Tentando reconectar...');
  client.initialize();
});

// ===============================
// MESSAGE HANDLER
// ===============================
client.on('message', async (msg) => {
  try {
    const chat = await msg.getChat();

    // exemplo simples de resposta
    if (msg.body.toLowerCase() === 'oi') {
      msg.reply('👋 Olá! Bot ativo e funcionando.');
    }

  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
  }
});

// ===============================
// START
// ===============================
client.initialize();