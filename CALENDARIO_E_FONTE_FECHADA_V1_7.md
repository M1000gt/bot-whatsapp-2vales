# Calendário completo e fonte fechada V1.7

## Calendário determinístico

O código passa a interpretar e validar:

- hoje;
- amanhã;
- depois de amanhã;
- dias da semana;
- próxima quinta/quinta que vem;
- datas com ano, como `13/08/2026`;
- datas sem ano, como `02/01`, escolhendo a próxima ocorrência futura;
- expressões como `dia 15`;
- viradas de mês e ano.

Antes de qualquer aviso ao grupo, o sistema bloqueia:

- datas passadas;
- datas inexistentes, como `31/02`;
- segunda-feira e terça-feira, quando o restaurante está fechado;
- datas que o sistema não consiga validar com segurança.

Essas barreiras são executadas pelo código e não dependem apenas do raciocínio do modelo.

## Informação não cadastrada

A Ana passa a trabalhar com fonte fechada para fatos sobre o 2Vales:

- só afirma informações presentes nos prompts oficiais ou no cardápio carregado;
- não completa respostas com suposição ou conhecimento geral;
- quando a informação não estiver cadastrada, informa que não a possui confirmada e oferece consultar a equipe;
- a oferta usa o marcador interno `[[OFERECER_CONFIRMACAO_EQUIPE]]`;
- um pedido direto usa `[[CONFIRMAR_COM_EQUIPE]]`;
- os marcadores nunca aparecem para o cliente.

Quando o cliente aceita a consulta com uma resposta curta, o código recupera a pergunta original e envia ao grupo. Assim, a equipe recebe a dúvida completa, e não somente uma mensagem como `sim`.

Uma oferta expira após 15 minutos. Respostas longas não são confundidas com um aceite curto.

## Validação esperada

```text
npm test: 70 aprovados, 0 falhas
node --check: arquivos JavaScript alterados sem erros de sintaxe
```

## Testes manuais sugeridos

1. `Quero reservar para 06/08/2026` — deve informar que a data passou e não avisar o grupo.
2. `Quero reservar para 31/02/2027` — deve pedir uma data válida e não avisar o grupo.
3. `Quero reservar para segunda-feira` — deve informar que o restaurante estará fechado.
4. `Quero reservar para 02/01` no fim do ano — deve escolher o próximo ano.
5. `Tem trocador para bebê no banheiro?` — se não estiver cadastrado, deve oferecer confirmação.
6. Responder `sim, por favor` — o grupo deve receber a pergunta original sobre o trocador.
