const fs = require('fs');

function carregarEnvOpenAI() {
    const envPath = '/root/bot-whatsapp-2vales/ChatBot/.env-openai';

    if (!fs.existsSync(envPath)) {
        console.error('Arquivo .env-openai não encontrado:', envPath);
        process.exit(1);
    }

    const linhas = fs.readFileSync(envPath, 'utf8').split('\n');

    for (const linha of linhas) {
        const limpa = linha.trim();

        if (!limpa || limpa.startsWith('#')) continue;

        const semExport = limpa.replace(/^export\s+/, '');
        const indexIgual = semExport.indexOf('=');

        if (indexIgual === -1) continue;

        const chave = semExport.slice(0, indexIgual).trim();
        let valor = semExport.slice(indexIgual + 1).trim();

        valor = valor.replace(/^['"]|['"]$/g, '');

        if (chave && valor) {
            process.env[chave] = valor;
        }
    }
}

carregarEnvOpenAI();

const { responderComIA } = require('../clientes/_modelo/ana/Ana');

const testes = [
    'Olá, vocês atendem hoje?',
    'Qual é o horário de funcionamento?',
    'Quanto custa?',
    'Consigo reservar para hoje às 20h?',
    'Vocês fazem entrega?',
    'Qual é o endereço?',
    'Aceita Pix?',
    'Tenho promoção de carne e frango para vender para vocês. Posso mandar tabela?',
    'Vocês têm vaga para 10 pessoas hoje?',
    'Qual é o cardápio de hoje?'
];

async function main() {
    console.log('===== TESTE DE SEGURANÇA — ANA MODELO =====');

    for (const pergunta of testes) {
        console.log('\n----------------------------------------');
        console.log('CLIENTE:', pergunta);

        const resposta = await responderComIA(pergunta, {
            nomeCliente: 'Cliente Teste',
            historico: ''
        });

        console.log('ANA:', resposta);
    }

    console.log('\n===== FIM DO TESTE =====');
}

main();
