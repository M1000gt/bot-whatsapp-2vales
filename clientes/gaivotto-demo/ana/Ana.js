const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const historicoConversas = {};

function carregarPrompt(nomeArquivo) {
    const caminho = path.join(__dirname, "Prompts", nomeArquivo);

    try {
        if (!fs.existsSync(caminho)) {
            console.warn(`Prompt não encontrado: ${caminho}`);
            return "";
        }

        return fs.readFileSync(caminho, "utf8");
    } catch (erro) {
        console.error(`Erro ao carregar prompt ${nomeArquivo}:`, erro.message);
        return "";
    }
}

const PROMPT_ANA = [
    carregarPrompt("Identidade/Identidade.txt"),
    carregarPrompt("Identidade/Personalidade.txt"),
    carregarPrompt("Negocio/Informacoes.txt"),
    carregarPrompt("Operacao/Regras.txt")
].filter(Boolean).join("\n\n");

async function falarComAna(numero, mensagemCliente) {
    if (!mensagemCliente || !String(mensagemCliente).trim()) {
        return "Desculpe, não consegui entender sua mensagem. Pode me enviar novamente?";
    }

    try {
        if (!process.env.OPENAI_API_KEY) {
            console.error("OPENAI_API_KEY não encontrada no ambiente.");
            return "Tive uma instabilidade momentânea no atendimento. Pode tentar novamente em instantes?";
        }

        if (!historicoConversas[numero]) {
            historicoConversas[numero] = [];
        }

        const agora = new Date();

        const contextoDataHora = `
DATA E HORA ATUAL DO SISTEMA:
- Data atual: ${agora.toLocaleDateString("pt-BR")}
- Hora atual: ${agora.toLocaleTimeString("pt-BR")}

CONTEXTO IMPORTANTE:
- Esta é uma demonstração da Gaivotto Studio.
- A assistente representa a Gaivotto Studio, não representa restaurante, pousada ou cliente específico.
- O objetivo é explicar como funciona um assistente virtual personalizado para WhatsApp.
`;

        const resposta = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: 0.7,
            messages: [
                {
                    role: "system",
                    content: `
${contextoDataHora}

${PROMPT_ANA}
`
                },
                ...historicoConversas[numero],
                {
                    role: "user",
                    content: mensagemCliente
                }
            ]
        });

        const textoResposta = resposta.choices?.[0]?.message?.content?.trim();

        if (!textoResposta) {
            return "Desculpe, tive dificuldade para gerar uma resposta agora. Pode tentar novamente?";
        }

        historicoConversas[numero].push({
            role: "user",
            content: mensagemCliente
        });

        historicoConversas[numero].push({
            role: "assistant",
            content: textoResposta
        });

        historicoConversas[numero] = historicoConversas[numero].slice(-20);

        return textoResposta;

    } catch (erro) {
        console.error("Erro OpenAI:", erro);

        return "Tive uma instabilidade momentânea no atendimento. Pode tentar novamente em instantes?";
    }
}

module.exports = {
    falarComAna
};
