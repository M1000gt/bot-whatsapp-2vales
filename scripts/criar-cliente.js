const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODELO_DIR = path.join(ROOT, 'clientes', '_modelo');
const CLIENTES_DIR = path.join(ROOT, 'clientes');
const DASHBOARD_CLIENTES_PATH = path.join(ROOT, 'dashboard', 'clientes.json');

const slug = process.argv[2];
const nome = process.argv[3];
const segmento = process.argv[4] || 'Cliente';

function sair(msg) {
    console.error(`❌ ${msg}`);
    process.exit(1);
}

function copiarPasta(origem, destino) {
    if (!fs.existsSync(origem)) {
        sair(`Pasta modelo não encontrada: ${origem}`);
    }

    fs.mkdirSync(destino, { recursive: true });

    for (const item of fs.readdirSync(origem)) {
        const origemItem = path.join(origem, item);
        const destinoItem = path.join(destino, item);
        const stat = fs.statSync(origemItem);

        if (stat.isDirectory()) {
            copiarPasta(origemItem, destinoItem);
        } else {
            fs.copyFileSync(origemItem, destinoItem);
        }
    }
}

function carregarJson(caminho, fallback) {
    try {
        if (!fs.existsSync(caminho)) return fallback;
        return JSON.parse(fs.readFileSync(caminho, 'utf8'));
    } catch (error) {
        sair(`Erro ao ler JSON ${caminho}: ${error.message}`);
    }
}

function salvarJson(caminho, data) {
    fs.writeFileSync(caminho, JSON.stringify(data, null, 2) + '\n');
}

if (!slug || !nome) {
    console.log(`
Uso:
  node scripts/criar-cliente.js <slug> "<Nome do Cliente>" "<Segmento>"

Exemplo:
  node scripts/criar-cliente.js pousada-serra "Pousada Serra" "Hospedagem"
`);
    process.exit(0);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
    sair('O slug deve conter apenas letras minúsculas, números e hífen. Exemplo: pousada-serra');
}

const destino = path.join(CLIENTES_DIR, slug);

if (fs.existsSync(destino)) {
    sair(`Cliente já existe: clientes/${slug}`);
}

console.log(`📁 Criando cliente: ${nome}`);
console.log(`🔑 Slug: ${slug}`);

copiarPasta(MODELO_DIR, destino);

const config = {
    slug,
    nome,
    subtitulo: 'Assistente virtual • WhatsApp IA',
    pm2: `bot-${slug}`,
    clientId: slug,
    tipo: 'Implantação',
    cliente: segmento,
    monitorar: false,

    grupoInterno: 'COLE_AQUI_O_ID_DO_GRUPO@g.us',

    qrImage: `/root/bot-whatsapp-2vales/clientes/${slug}/qrcode.png`,
    qrStatus: `/root/bot-whatsapp-2vales/clientes/${slug}/qrcode-status.json`,
    conversationLog: `/root/bot-whatsapp-2vales/clientes/${slug}/logs/conversas.log`,
    leadsLog: `/root/bot-whatsapp-2vales/clientes/${slug}/logs/leads.log`,
    controlFile: `/root/bot-whatsapp-2vales/clientes/${slug}/control.json`
};

salvarJson(path.join(destino, 'config.json'), config);

salvarJson(path.join(destino, 'control.json'), {
    autoReply: true
});

fs.mkdirSync(path.join(destino, 'logs', 'conversas'), { recursive: true });
fs.mkdirSync(path.join(destino, 'logs', 'leads'), { recursive: true });

const clientesDashboard = carregarJson(DASHBOARD_CLIENTES_PATH, []);

const jaExisteNoDashboard = clientesDashboard.some(item =>
    item.pm2 === config.pm2 || item.slug === slug
);

if (!jaExisteNoDashboard) {
    clientesDashboard.push({
        nome: config.nome,
        subtitulo: config.subtitulo,
        pm2: config.pm2,
        tipo: config.tipo,
        cliente: config.cliente,
        monitorar: config.monitorar,
        qrImage: config.qrImage,
        qrStatus: config.qrStatus,
        conversationLog: config.conversationLog,
        leadsLog: config.leadsLog,
        controlFile: config.controlFile
    });

    salvarJson(DASHBOARD_CLIENTES_PATH, clientesDashboard);
    console.log('✅ Cliente adicionado ao dashboard/clientes.json');
} else {
    console.log('⚠️ Cliente já existia no dashboard/clientes.json. Não adicionei duplicado.');
}

console.log('');
console.log('✅ Cliente criado com sucesso.');
console.log('');
console.log('Próximos passos:');
console.log(`1. Editar clientes/${slug}/config.json`);
console.log(`2. Editar prompts em clientes/${slug}/ana/Prompts/`);
console.log('3. Adicionar grupo interno real');
console.log('4. Criar/ligar o chatbot universal para esse cliente');
console.log('5. Adicionar PM2 quando o bot estiver pronto');
