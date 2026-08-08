# Telefone real em todos os avisos — V1.14

## Objetivo

Aplicar a conversão segura de `@lid` para telefone, validada no delivery, a todos os avisos internos da Ana.

## Avisos cobertos

- pedido de delivery;
- nova solicitação de reserva;
- atualização de solicitação de reserva;
- solicitação de atendimento humano;
- confirmação de informação com a equipe;
- mensagem administrativa ou de fornecedor.

## Comportamento

- quando o WhatsApp disponibiliza a relação entre LID e telefone, o grupo recebe o número formatado;
- quando não disponibiliza, o aviso informa que o telefone não está disponível e mantém o LID somente como referência técnica;
- nome e telefone são resolvidos por uma única rotina comum, evitando comportamentos diferentes entre os avisos;
- o ID interno nunca é apresentado como se fosse um número de telefone.
