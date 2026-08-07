# Correção de horários V1.1

## Falha observada na homologação

Em 07/08/2026, uma sexta-feira, a Ana respondeu que o restaurante funcionava até 22h. O horário oficial de sexta-feira é até 23h.

## Causa

O prompt possuía a tabela oficial correta, mas também continha um exemplo genérico e fixo com a frase “Hoje funcionamos das 12h às 22h”. O modelo reproduziu o exemplo sem ajustar o horário ao dia calculado pelo sistema.

## Correção

- Centraliza o horário oficial por dia da semana no contexto calculado em `America/Sao_Paulo`.
- Injeta no prompt dinâmico o horário oficial de hoje e de amanhã.
- Determina que o horário calculado prevalece sobre exemplos estáticos.
- Remove do exemplo genérico o valor fixo de 22h.
- Adiciona teste específico para sexta-feira e teste contra a regressão do exemplo fixo.

## Validação

```text
npm test: 27 aprovados, 0 falhas
node --check: arquivos JavaScript alterados aprovados
```
