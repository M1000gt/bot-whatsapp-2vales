const fs = require('fs');
const path = require('path');

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

const { responderComIA, montarPromptSistema } = require('../clientes/_modelo/ana/Ana');

async function main() {
    console.log('===== PROMPT SISTEMA =====');
    console.log(montarPromptSistema());

    console.log('\n===== RESPOSTA IA =====');

    const resposta = await responderComIA('Olá, vocês atendem hoje?', {
        nomeCliente: 'Cliente Teste',
        historico: ''
    });

    console.log(resposta);
}

main();
