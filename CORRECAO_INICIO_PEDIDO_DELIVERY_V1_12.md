# Correção do início do pedido delivery — V1.12

## Problema observado

A frase "quero fazer um pedido delivery" podia cair na regra de informação não cadastrada, enquanto "pedido para entrega" era entendida corretamente.

## Correção

- reconhece de forma determinística "pedido delivery" e "pedido para entrega" como a mesma intenção;
- responde antes da IA e solicita os dados iniciais do pedido;
- não confunde perguntas informativas, como "vocês fazem delivery?", com um pedido iniciado;
- preserva a prioridade do bloqueio dos pratos da Boa Lembrança;
- limpa uma eventual oferta antiga de confirmação com a equipe ao iniciar o pedido;
- mantém a confirmação final, a taxa, o prazo, a área atendida e o pagamento sob responsabilidade da equipe.

## Fluxo esperado

1. Cliente: "quero fazer um pedido delivery".
2. Ana solicita nome, localidade/endereço, prato, acompanhamento, quantidade e observação.
3. Cliente envia os dados.
4. O fluxo seguro da V1.11 encaminha o pedido ao grupo sem confirmá-lo automaticamente.
