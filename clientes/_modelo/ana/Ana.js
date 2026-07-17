const fs = require('fs');
const path = require('path');
const { dataHoraBrasil } = require('../../../core/utils/dataHoraBrasil');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const BASE_DIR = __dirname;

function lerArquivoSeguro(caminho, fallback = '') {
    try {
        if (!fs.existsSync(caminho)) {
            return fallback;
        }

        return fs.readFileSync(caminho, 'utf8');
    } catch (error) {
        console.error(`Erro ao ler arquivo ${caminho}:`, error.message);
        return fallback;
    }
}

function carregarPrompts() {
    const identidade = lerArquivoSeguro(
        path.join(BASE_DIR, 'Prompts', 'Identidade', 'Identidade.txt')
    );

    const personalidade = lerArquivoSeguro(
        path.join(BASE_DIR, 'Prompts', 'Identidade', 'Personalidade.txt')
    );

    const informacoes = lerArquivoSeguro(
        path.join(BASE_DIR, 'Prompts', 'Negocio', 'Informacoes.txt')
    );

    const regras = lerArquivoSeguro(
        path.join(BASE_DIR, 'Prompts', 'Operacao', 'Regras.txt')
    );

    const estiloUniversal = lerArquivoSeguro(
        path.join(BASE_DIR, '..', '..', '..', 'core', 'prompts', 'EstiloAnaUniversal.txt')
    );

    const exemplos = lerArquivoSeguro(
        path.join(BASE_DIR, 'Prompts', 'Identidade', 'Exemplos.txt')
    );

    return {
        identidade,
        personalidade,
        informacoes,
        regras,
        estiloUniversal,
        exemplos
    };
}

function montarPromptSistema() {
    const prompts = carregarPrompts();

    return `
${prompts.identidade}

${prompts.personalidade}

ESTILO UNIVERSAL:
${prompts.estiloUniversal}

INFORMAÇÕES DO NEGÓCIO:
${prompts.informacoes}

REGRAS DE OPERAÇÃO:
${prompts.regras}

EXEMPLOS DE RESPOSTA:
${prompts.exemplos}

INSTRUÇÕES FINAIS:
- Responda sempre em português brasileiro.
- Responda de forma natural, educada e objetiva.
- Não invente informações.
- Use somente as informações que estão escritas nos prompts do cliente.
- Se a informação não estiver no prompt, diga que precisa confirmar com a equipe responsável.
- Nunca confirme horário de funcionamento, atendimento no dia, disponibilidade, reserva, preço, prazo, entrega ou orçamento sem informação explícita no prompt.
- Se o cliente perguntar algo como "vocês atendem hoje?", "está aberto?", "tem vaga?", "qual o horário?" e o horário não estiver informado, não diga sim nem não. Encaminhe para confirmação da equipe.
- Não mencione que você é uma IA, a menos que seja perguntado diretamente.
- Não chame o cliente pelo nome, mesmo que o nome esteja disponível.

EXEMPLO DE RESPOSTA QUANDO FALTAR INFORMAÇÃO:
"Olá! Para te confirmar isso certinho, vou encaminhar sua dúvida para a equipe responsável."
`.trim();
}

function extrairTextoResposta(resposta) {
    if (resposta.output_text) {
        return resposta.output_text.trim();
    }

    try {
        const partes = resposta.output || [];

        for (const parte of partes) {
            if (!parte.content) continue;

            for (const conteudo of parte.content) {
                if (conteudo.type === 'output_text' && conteudo.text) {
                    return conteudo.text.trim();
                }
            }
        }
    } catch (error) {
        console.error('Erro ao extrair texto da resposta da IA:', error.message);
    }

    return 'Desculpe, não consegui responder agora. Vou encaminhar para a equipe responsável.';
}

async function responderComIA(mensagemCliente, contexto = {}) {
    try {
        const promptSistema = montarPromptSistema();

        const historico = contexto.historico || '';

        const input = [
            {
                role: 'system',
                content: promptSistema
            },
            {
                role: 'user',
                content: `
Data e hora atual no Brasil:
${dataHoraBrasil()}

Histórico recente da conversa:
${historico || 'Sem histórico recente.'}

Mensagem atual do cliente:
${mensagemCliente}
`.trim()
            }
        ];

        const resposta = await openai.responses.create({
            model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
            input,
            temperature: 0.455
        });

        return extrairTextoResposta(resposta);
    } catch (error) {
        console.error('Erro ao gerar resposta com IA:', error.message);

        return 'Desculpe, não consegui responder agora. Vou encaminhar para a equipe responsável.';
    }
}

module.exports = {
    responderComIA,
    montarPromptSistema,
    carregarPrompts
};
