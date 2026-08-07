# Correção do fluxo de pedido delivery V1.11

## Falha observada

Depois de a Ana solicitar nome, localidade/endereço, prato, acompanhamento e quantidade, o cliente enviou:

`gustavo vale da boa esperança sitio 2 filet framboises dividido c/ roesti ao ponto`

O pedido chegou ao grupo, mas a Ana respondeu ao cliente que não possuía a informação confirmada. O resumo do grupo também recebeu essa resposta inadequada.

## Correções

- O código reconhece mensagens com prato e detalhes de pedido, como quantidade, acompanhamento, divisão, ponto da carne, localidade ou endereço.
- O fluxo de pedido delivery passa a ter prioridade sobre a regra geral de informação desconhecida.
- A Ana confirma apenas o recebimento dos dados, nunca o fechamento do pedido.
- A resposta informa que a equipe ainda confirmará:
  - disponibilidade do prato;
  - endereço e área atendida;
  - taxa e prazo de entrega;
  - forma de pagamento;
  - fechamento do pedido.
- O grupo recebe a mensagem original e um resumo seguro, sem a frase `não tenho essa informação confirmada`.
- Qualquer consulta de informação pendente é limpa quando o fluxo de pedido assume a conversa.
- Perguntas pontuais como `quanto custa o filet?` não são confundidas com pedido completo.
- A trava de Boa Lembrança no delivery continua tendo prioridade sobre esse fluxo.

## Validação esperada

```text
npm test: 86 aprovados, 0 falhas
```

## Teste manual

1. Enviar `quero fazer um pedido delivery`.
2. Depois, enviar `gustavo vale da boa esperança sitio 2 filet framboises dividido c/ roesti ao ponto`.
3. A Ana deve informar que recebeu e encaminhou os dados, mas que a equipe ainda confirmará o pedido.
4. O grupo deve receber a mensagem original e o mesmo resumo seguro.
