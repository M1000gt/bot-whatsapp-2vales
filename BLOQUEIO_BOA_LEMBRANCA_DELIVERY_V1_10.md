# Bloqueio determinístico de Boa Lembrança no delivery V1.10

## Falha observada

Ao solicitar `Surpresa de Bombom no delivery`, a Ana respondeu que não possuía a informação confirmada, embora a regra oficial determine que todos os pratos da Boa Lembrança são exclusivos para consumo no restaurante.

## Correções

- O código identifica deterministicamente os três pratos atuais:
  - Polpetone de Filé Mignon;
  - Ossobuco de Vitelo;
  - Surpresa de Bombom/Bombom de Alcatra.
- Também identifica pedidos genéricos por `prato da Boa Lembrança`.
- Solicitações de delivery, entrega ou envio desses pratos são bloqueadas pelo código.
- A resposta informa que o prato é exclusivo para consumo no restaurante e oferece outras opções do cardápio para delivery.
- Marcadores incorretos de delivery, atendente ou confirmação com a equipe são ignorados nesse caso.
- Nenhum pedido ou dúvida é encaminhado ao grupo por causa dessa tentativa de delivery.
- O cardápio interno reforça explicitamente que os três pratos não estão disponíveis para delivery.

## Validação esperada

```text
npm test: 80 aprovados, 0 falhas
```

## Testes manuais

1. `Quero pedir o Surpresa de Bombom no delivery`.
2. `Vocês entregam o Polpetone de Filé Mignon?`.
3. `Quero um prato da Boa Lembrança para entrega`.

Nos três casos, a Ana deve negar o delivery e nenhuma mensagem deve chegar ao grupo.
