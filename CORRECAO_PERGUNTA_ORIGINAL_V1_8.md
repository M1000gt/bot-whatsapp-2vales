# Correção da pergunta original V1.8

## Falha observada

Após a Ana oferecer uma consulta à equipe, o cliente respondeu `sim pode confirmar`. Essa forma exata não era reconhecida como um aceite curto. A mensagem seguiu para o modelo, e o grupo recebeu `sim pode confirmar` no campo `Pergunta original`, em vez da dúvida anterior.

## Correções

- `sim pode confirmar`, `sim pode` e `sim confirma` passam a ser aceites reconhecidos pelo código.
- A pergunta pendente é recuperada antes da chamada à IA.
- Se não houver uma pergunta pendente recuperável, uma confirmação curta nunca é enviada sozinha ao grupo; a Ana pede ao cliente que repita a dúvida.
- O sistema também reconhece pelo texto quando a Ana ofereceu consultar a equipe, mesmo que o modelo deixe de incluir o marcador interno.
- O modelo não pode encaminhar uma dúvida por iniciativa própria. Sem pedido explícito, o fluxo volta a apenas oferecer a consulta.
- Pedidos diretos, como `pode confirmar com a equipe se tem trocador?`, continuam sendo encaminhados imediatamente com a pergunta completa.

## Ajuste adicional de calendário

Uma data recém-passada sem ano, como `06/08` em `07/08`, não é mais transformada silenciosamente em `06/08` do ano seguinte.

Datas próximas da virada do ano continuam funcionando: em `31/12`, uma solicitação para `02/01` aponta para o próximo ano.

## Validação esperada

```text
npm test: 73 aprovados, 0 falhas
```

## Teste manual

1. Perguntar `O evento do Bar do Horto começa quando?`.
2. A Ana deve dizer que não possui a informação confirmada e oferecer consulta.
3. Responder `sim pode confirmar`.
4. O grupo deve receber como pergunta original: `O evento do Bar do Horto começa quando?`.
5. O grupo nunca deve receber apenas `sim pode confirmar` como pergunta original.
