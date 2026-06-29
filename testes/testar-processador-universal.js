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
const { processarMensagemCliente } = require('../core/atendimento/processadorMensagem');

const mensagens = [
    'Olá, vocês atendem hoje?',
    'Quanto custa?',
    'Tenho promoção de carne e frango para vender para vocês. Posso mandar tabela?',
    'Segue nota fiscal para pagamento.',
    'Sou fornecedor de bebidas, posso falar com o responsável?',
    'Consigo reservar para hoje às 20h?'
];

async function main() {
    console.log('===== TESTE DO PROCESSADOR UNIVERSAL =====');

    for (const texto of mensagens) {
        console.log('\n----------------------------------------');
        console.log('MENSAGEM:', texto);

        const resultado = await processarMensagemCliente({
            texto,
            contato: {
                nome: 'Cliente Teste',
                numero: '24999999999@c.us'
            },
            responderComIA
        });

        console.log('TIPO:', resultado.tipo);
        console.log('DEVE RESPONDER CLIENTE:', resultado.deveResponderCliente);

        if (resultado.respostaCliente) {
            console.log('RESPOSTA CLIENTE:', resultado.respostaCliente);
        }

        if (resultado.avisoInterno) {
            console.log('AVISO INTERNO:');
            console.log(resultado.avisoInterno);
        }
    }

    console.log('\n===== FIM DO TESTE =====');
}

main();
