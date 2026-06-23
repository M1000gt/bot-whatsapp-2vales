const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'gaivotto-demo'
    }),

    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--ignore-certificate-errors'
        ]
    }
});

client.on('ready', async () => {
    console.log('✅ Conectado. Listando grupos...\n');

    const chats = await client.getChats();

    chats.forEach(chat => {
        if (chat.isGroup) {
            console.log('-------------------------');
            console.log('GRUPO:', chat.name);
            console.log('ID:', chat.id._serialized);
        }
    });

    process.exit(0);
});

client.initialize();
