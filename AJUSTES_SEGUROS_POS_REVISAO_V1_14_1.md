# Ajustes seguros pós-revisão — V1.14.1

Esta etapa aplica somente correções pequenas e isoladas apontadas na segunda revisão técnica. Ela não inclui o redesenho do motor de datas nem a persistência do handoff automático, que terão etapas próprias.

## Alterações

- saudação baseada explicitamente no fuso `America/Sao_Paulo`;
- data e hora centralizadas em `core/utils/dataHoraBrasil.js`;
- remoção das cópias mortas de `saudacao()` e `dataHoraBrasil()` dentro do chatbot;
- filtros de atendimento humano e administrativo executados antes de alterar contexto de reserva ou delivery;
- correção do falso positivo da abreviação `NF` no classificador universal desconectado;
- prompt universal mantido isolado e documentado como referência, evitando conflito com os prompts específicos do 2Vales;
- `package.json` apontando para o chatbot ativo existente;
- testes de regressão para todos esses comportamentos.

## Fora do escopo

- terceira ou demais ocorrências de dias da semana;
- persistência do handoff automático implementado diretamente em `ChatBot/chatbot.js`;
- calendário anual de exceções;
- refinamentos de pet, delivery e substituição seletiva de datas.

Esses itens serão tratados separadamente para preservar rastreabilidade e facilitar rollback.
