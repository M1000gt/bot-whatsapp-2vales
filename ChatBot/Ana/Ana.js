const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const historicoConversas = {};

function carregarPrompt(nomeArquivo) {
    return fs.readFileSync(
        path.join(__dirname, "Prompts", nomeArquivo),
        "utf8"
    );
}

const PROMPT_ANA = [
    carregarPrompt("Identidade/Identidade.txt"),
    carregarPrompt("Identidade/Personalidade.txt"),
    carregarPrompt("Negocio/Informacoes.txt"),
    carregarPrompt("Negocio/Pets.txt"),
    carregarPrompt("Operacao/Regras.txt"),
    carregarPrompt("Operacao/Reservas.txt"),
    carregarPrompt("Operacao/Exemplos.txt"),
    carregarPrompt("Operacao/RespostasObjetivas.txt"),
     carregarPrompt("Operacao/Validacoes.txt"),
     carregarPrompt("Operacao/AntiInvencao.txt"),
     carregarPrompt("Negocio/Cardapio.txt"),
].join("\n\n");

async function falarComAna(numero, mensagemCliente) {
   
    if (!mensagemCliente) {
    return "Desculpe, não consegui entender sua mensagem.";
}

   try {

    const diasSemana = [
        "domingo",
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado"
    ];

    const agora = new Date();

    const diaSemana = diasSemana[agora.getDay()];

    const amanha = new Date(agora);
    amanha.setDate(agora.getDate() + 1);

    const diaSemanaAmanha = diasSemana[amanha.getDay()];

    const abertoHoje =
        ["quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"]
        .includes(diaSemana);

    const abertoAmanha =
        ["quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"]
        .includes(diaSemanaAmanha);

    const contextoDataHora = `
DATA E HORA ATUAL DO SISTEMA:
- Data atual: ${agora.toLocaleDateString('pt-BR')}
- Dia da semana atual: ${diaSemana}
- Hora atual: ${agora.toLocaleTimeString('pt-BR')}
- Restaurante aberto hoje: ${abertoHoje ? "SIM" : "NÃO"}

REFERÊNCIA DE AMANHÃ:
- Amanhã será: ${amanha.toLocaleDateString('pt-BR')}
- Dia da semana de amanhã: ${diaSemanaAmanha}
- Restaurante aberto amanhã: ${abertoAmanha ? "SIM" : "NÃO"}
`

        // Cria histórico se não existir
        if (!historicoConversas[numero]) {
            historicoConversas[numero] = [];
        }

        const resposta = await openai.chat.completions.create({

            model: "gpt-4.1-mini",

            temperature: 0.8,

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

        const textoResposta =
            resposta.choices[0].message.content;

        // Salva usuário
        historicoConversas[numero].push({
            role: "user",
            content: mensagemCliente
        });

        // Salva Ana
        historicoConversas[numero].push({
            role: "assistant",
            content: textoResposta
        });

        // Limita memória
        historicoConversas[numero] =
            historicoConversas[numero].slice(-30);

        return textoResposta;

    } catch (erro) {

        console.error(
            "Erro OpenAI:",
            erro
        );

        return "Peço desculpas, senhor. Tivemos uma instabilidade momentânea no atendimento. Poderia tentar novamente em instantes?";
    }
}

module.exports = {
    falarComAna
};