# Correção do envio condicional de cardápio V1.4

## Falha observada

Ao perguntar apenas o preço do Lapin aux marrons, a Ana respondeu corretamente `R$ 139,00`, ofereceu o cardápio e, ao mesmo tempo, enviou o PDF sem aguardar a confirmação do cliente.

## Correção

- O prompt usa `[[ENVIAR_CARDAPIO]]` somente em pedido explícito pelo cardápio completo/PDF ou depois de uma resposta afirmativa do cliente.
- Perguntas pontuais sobre preço, ingredientes ou um prato específico não acionam o PDF.
- Uma validação determinística no `chatbot.js` ignora o marcador se a mensagem do cliente não autorizar o envio.
- Pedidos explícitos e confirmações curtas como “sim, pode enviar” continuam funcionando.

## Validação esperada

```text
npm test: 39 aprovados, 0 falhas
```
