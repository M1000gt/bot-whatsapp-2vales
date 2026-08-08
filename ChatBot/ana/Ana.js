const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const { obterContextoDataBrasil } = require('../../core/utils/contextoDataBrasil');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const historicoConversas = {};

function registrarInteracaoAna(numero, mensagemCliente, respostaAna) {
    if (!numero || !mensagemCliente || !respostaAna) return;

    if (!historicoConversas[numero]) {
        historicoConversas[numero] = [];
    }

    historicoConversas[numero].push({
        role: "user",
        content: String(mensagemCliente)
    });
    historicoConversas[numero].push({
        role: "assistant",
        content: String(respostaAna)
    });
    historicoConversas[numero] = historicoConversas[numero].slice(-30);
}

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

    const {
        dataAtual,
        horaAtual,
        diaSemana,
        abertoHoje,
        horarioHoje,
        dataAmanha,
        diaSemanaAmanha,
        abertoAmanha,
        horarioAmanha,
        calendarioProximosDias
    } = obterContextoDataBrasil();

    const calendarioFormatado = calendarioProximosDias
        .map(dia => `- ${dia.diaSemana}: ${dia.data} — ${dia.horario}`)
        .join('\n');

    const contextoDataHora = `
DATA E HORA ATUAL DO SISTEMA:
- Data atual: ${dataAtual}
- Dia da semana atual: ${diaSemana}
- Hora atual: ${horaAtual}
- Restaurante aberto hoje: ${abertoHoje ? "SIM" : "NÃO"}
- Horário oficial de hoje: ${horarioHoje}

REFERÊNCIA DE AMANHÃ:
- Amanhã será: ${dataAmanha}
- Dia da semana de amanhã: ${diaSemanaAmanha}
- Restaurante aberto amanhã: ${abertoAmanha ? "SIM" : "NÃO"}
- Horário oficial de amanhã: ${horarioAmanha}

CALENDÁRIO OFICIAL — HOJE E PRÓXIMOS 14 DIAS:
${calendarioFormatado}

REGRA CRÍTICA DE HORÁRIO:
- Para perguntas sobre hoje ou amanhã, use obrigatoriamente os horários oficiais calculados acima.
- Nunca copie um horário fixo de um exemplo se ele divergir do dia da semana calculado pelo sistema.
- Em uma nova reserva, quando o cliente disser apenas um dia da semana, use a primeira ocorrência desse dia que seja hoje ou futura, conforme o calendário oficial. Nunca escolha uma data que já passou.
- Se o cliente disser "próxima quinta", "quinta que vem" ou expressão equivalente, escolha uma ocorrência estritamente futura.
- "Outro domingo", "outra quinta", "dia da semana seguinte", "dia da outra semana" ou "sem ser nesse dia, no outro" significa a ocorrência imediatamente posterior à primeira ocorrência disponível do mesmo dia da semana. A regra vale para todos os sete dias. Nunca volte para uma data anterior e nunca inverta a ordem das datas.
- Repetir apenas "o outro" mantém essa segunda ocorrência; não some mais sete dias. Só avance novamente se o cliente disser explicitamente "mais um depois desse", "o dia depois desse" ou indicar "terceiro", "quarto" etc.
- Se o sistema fornecer uma resposta determinística de data no histórico, considere essa data como fonte oficial e não a recalcule.
`

        // Cria histórico se não existir
        if (!historicoConversas[numero]) {
            historicoConversas[numero] = [];
        }

        const resposta = await openai.chat.completions.create({

            model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

            temperature: 0.8,

            max_completion_tokens: 500,

            store: false,

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
            throw new Error('A OpenAI retornou uma resposta vazia.');
        }

        registrarInteracaoAna(numero, mensagemCliente, textoResposta);

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
    falarComAna,
    registrarInteracaoAna
};
