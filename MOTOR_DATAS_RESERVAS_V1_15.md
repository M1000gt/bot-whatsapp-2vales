# Motor determinístico de datas de reservas — V1.15

Esta etapa corrige a interpretação de referências relativas como "esse domingo", "o outro domingo" e "mais um depois desse". O cálculo deixa de depender da interpretação livre do modelo e passa a ser feito pelo código antes da resposta ao cliente.

## Regra de ocorrências

- um dia da semana sem qualificador escolhe a primeira ocorrência válida a partir de hoje;
- "próxima quinta" ou "quinta que vem" é estritamente futura quando hoje já é quinta;
- "outro domingo", "domingo seguinte", "domingo da outra semana" e "sem ser esse, o outro" escolhem a segunda ocorrência;
- repetir "o outro" mantém a segunda ocorrência e não acrescenta outra semana;
- somente uma expressão explícita como "mais um depois desse" avança a ocorrência atual;
- "terceiro domingo", "quarta ocorrência" e ordinais equivalentes selecionam diretamente a ocorrência indicada;
- "nesse domingo mesmo" e "volta para o primeiro" retornam à primeira ocorrência.

O estado guarda separadamente o dia da semana, a regra de data estritamente futura e o número da ocorrência. Assim, uma repetição não altera acidentalmente a data.

## Calendário completo

O sistema não possui um calendário que termina depois de 15 dias. A lista de 15 dias é apenas uma janela móvel enviada ao modelo para facilitar respostas comuns. O motor determinístico calcula datas para qualquer mês ou ano, incluindo viradas de mês, viradas de ano e anos bissextos, sem depender dessa janela.

## Segurança do fluxo

- o cálculo determinístico é usado antes da IA nas correções curtas de data;
- a interação determinística também entra no histórico da Ana, evitando que a próxima mensagem perca o contexto;
- uma pergunta informativa sobre horário não abre nem contamina o contexto de reserva;
- datas passadas, inexistentes, segundas-feiras e terças-feiras continuam bloqueadas antes do aviso ao grupo;
- depois de uma data inválida, o valor é removido do contexto para não reaparecer na mensagem seguinte;
- uma correção posterior a uma solicitação já encaminhada gera uma atualização no grupo;
- mensagens com todos os dados da reserva ainda seguem para a Ana, mas a data final é reconciliada pelo motor antes do envio ao grupo.

## Cobertura automatizada

Os testes incluem:

- reprodução exata de "quero fazer uma reserva sem ser nesse domingo no outro" em 08/08/2026, resultando em 16/08/2026;
- repetição idempotente de "o outro";
- avanço explícito para terceira ocorrência e retorno à primeira;
- primeira, segunda e terceira ocorrências nos sete dias da semana;
- horários corretos de quarta-feira a domingo;
- bloqueio de segunda-feira e terça-feira;
- virada de mês e de ano;
- data explícita além da janela de 15 dias;
- isolamento entre perguntas de horário e fluxo de reserva;
- atualização determinística de solicitação já enviada ao grupo.

## Arquivos principais

- `core/utils/contextoDataBrasil.js`
- `core/utils/intencaoDataReserva.js`
- `core/utils/contextoReservaCliente.js`
- `ChatBot/chatbot.js`
- `ChatBot/ana/Ana.js`
- `ChatBot/ana/Prompts/Operacao/Regras.txt`
- testes unitários relacionados a datas, contexto e fluxo determinístico

