# Correção do indicador “digitando” V1.2

## Falha observada na homologação

Após a Ana responder e enviar o cardápio em PDF, o WhatsApp continuava exibindo “digitando...” por algum tempo.

## Causa

- O indicador era encerrado apenas no `finally`, depois do envio do texto e do upload do PDF.
- Uma renovação periódica iniciada imediatamente antes da parada poderia terminar depois da limpeza e reativar o indicador.

## Correção

- Encerra o indicador antes da primeira resposta visível ao cliente.
- Não mantém “digitando...” durante o upload do cardápio.
- Aguarda eventual renovação em andamento antes de limpar definitivamente o estado.
- Mantém o `finally` como proteção para fluxos que falharem antes da resposta.

## Validação

```text
npm test: 27 aprovados, 0 falhas
node --check ChatBot/chatbot.js: aprovado
```
