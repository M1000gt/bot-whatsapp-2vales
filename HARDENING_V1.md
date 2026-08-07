# Ana Hardening V1 — homologação

Data: 07/08/2026

Esta pasta foi criada a partir da cópia sanitizada da revisão de 04/08/2026. Nenhum arquivo desta versão foi enviado ao VPS ou aplicado ao processo `bot2vales`.

## Alterações implementadas

- Fila por conversa para impedir respostas fora de ordem.
- Parser central dos marcadores internos da Ana.
- Remoção de qualquer marcador interno conhecido ou desconhecido antes da resposta ao cliente.
- Reserva somente aciona o grupo quando possui nome, data, horário, quantidade e ambiente preenchidos.
- Ações internas de delivery, reserva e atendente acontecem antes da confirmação ao cliente.
- Falhas do WhatsApp deixam de ser silenciosas no utilitário de envio.
- Estado “digitando” sempre é encerrado em `finally`.
- Comandos públicos `#teste-handoff` e `#fim-handoff` removidos.
- Classificador do 2Vales centralizado e menos agressivo com palavras de clientes como pagamento, contrato e documento.
- Data, hora, hoje e amanhã calculados em `America/Sao_Paulo`.
- Resposta vazia da OpenAI tratada como erro recuperável.
- Limite de 500 tokens de saída e `store: false` definidos na chamada da Ana.
- Máscara ampliada para chave de API, CPF, CNPJ, e-mail, telefone e identificador do WhatsApp nos logs.
- `clientId`, modelo, grupo interno e caminho do cardápio podem ser sobrescritos por variáveis de ambiente.
- Cardápio padrão resolvido por caminho absoluto, sem depender do diretório usado pelo PM2.

## Validação executada

```text
npm test: 25 aprovados, 0 falhas
node --check: 185 arquivos JavaScript aprovados, 0 falhas
varredura de chaves OpenAI nos arquivos ativos: nenhuma encontrada
```

Os testes são offline e não acessam OpenAI, WhatsApp, PM2, credenciais ou conversas reais.

## Arquivos principais alterados

- `ChatBot/chatbot.js`
- `ChatBot/ana/Ana.js`
- `ChatBot/Utils/enviar.js`
- `ChatBot/config/config.js`
- `package.json`

## Arquivos adicionados

- `ChatBot/.env.example`
- `core/utils/acoesAna.js`
- `core/utils/classificador2Vales.js`
- `core/utils/contextoDataBrasil.js`
- `core/utils/filaPorChave.js`
- `core/utils/mascararDadosSensiveis.js`
- `testes/unit/*.test.js`

## O que ainda bloqueia produção

1. Confirmar se o código atual no VPS continua igual à cópia de 04/08/2026.
2. Criar branch Git e backup/rollback antes de copiar qualquer arquivo.
3. Rodar estes testes no VPS ou numa cópia local completa com as dependências instaladas.
4. Realizar teste integrado com outro `WWEBJS_CLIENT_ID` e grupo de homologação, nunca com o número/grupo real.
5. Confirmar as regras comerciais contraditórias sobre preços, localização comercial, delivery e reservas em dias fechados.
6. Trocar as credenciais que entraram no pacote antes de liberar uma nova versão.
7. Endurecer painel, retenção de logs, handoff persistente e dependências em lotes posteriores.

## Variáveis disponíveis para homologação

Consulte `ChatBot/.env.example`. O código não carrega esse arquivo automaticamente; as variáveis devem ser fornecidas pelo ambiente/PM2.

Nunca reutilize na homologação o `WWEBJS_CLIENT_ID=bot2vales` nem o grupo real de reservas.
