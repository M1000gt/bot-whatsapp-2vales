# Correção de data futura em reservas V1.6

## Falha observada

Na sexta-feira, 07/08/2026, o cliente pediu uma reserva para `quinta-feira`. A Ana escolheu 06/08/2026, que era a quinta-feira anterior, em vez da próxima quinta-feira, 13/08/2026.

## Correções

- O sistema calcula deterministicamente a próxima ocorrência de cada dia da semana no fuso `America/Sao_Paulo`.
- Um pedido feito na sexta para `quinta-feira` passa a usar 13/08/2026, nunca 06/08/2026.
- Quando o dia informado é o dia atual, ele continua valendo como hoje.
- Expressões como `próxima quinta` e `quinta que vem` exigem uma ocorrência estritamente futura.
- A Ana recebe no prompt um calendário oficial com hoje e os próximos sete dias, incluindo datas e horários de funcionamento.
- A data guardada a partir da mensagem original do cliente é usada para corrigir tanto a resposta visível quanto o bloco enviado ao grupo.

## Validação esperada

```text
npm test: 54 aprovados, 0 falhas
node --check: arquivos JavaScript alterados sem erros de sintaxe
```

## Teste manual principal

Em uma sexta-feira, solicitar uma reserva para `quinta-feira` e confirmar que:

- a Ana usa a data da quinta-feira seguinte;
- nenhuma data passada aparece na conversa;
- o grupo recebe a mesma data futura apresentada ao cliente.
