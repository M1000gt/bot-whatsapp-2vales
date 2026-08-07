# Correção de reservas V1.5

## Falhas observadas

Durante o teste de homologação, a mensagem `neo tenho pet` foi interpretada como se o cliente tivesse pet. A Ana alterou o ambiente interno para externo, enviou uma solicitação incorreta, encaminhou uma segunda solicitação completa após a correção e, depois de o cliente dizer `perfeito`, respondeu de uma forma que poderia ser entendida como confirmação da reserva.

## Correções

- A negação de pet é identificada no código antes da resposta do modelo, incluindo `não tenho pet`, `nao tenho pet`, `n tenho pet`, `sem pet` e o erro observado `neo tenho pet`.
- O ambiente informado anteriormente pelo cliente é preservado; pet confirmado continua forçando o ambiente externo.
- Os dados do bloco interno da reserva são reconciliados com as informações explícitas do cliente antes do aviso ao grupo.
- A primeira solicitação é marcada como `NOVA SOLICITAÇÃO`.
- Uma repetição idêntica é ignorada e não produz um segundo aviso.
- Uma alteração real é enviada como `ATUALIZAÇÃO`, com aviso de que substitui os dados anteriores.
- Respostas curtas de cortesia depois do encaminhamento deixam explícito que a reserva ainda depende da confirmação da equipe pelo WhatsApp.
- O prompt foi reforçado para regenerar o bloco completo quando o cliente corrigir qualquer dado.

## Validação esperada

```text
npm test: 50 aprovados, 0 falhas
node --check: arquivos JavaScript alterados sem erros de sintaxe
```

## Teste manual principal

1. Solicitar reserva para hoje.
2. Informar nome, 8 pessoas e ambiente interno.
3. Escrever `neo tenho pet, pode ser às 20h`.
4. Confirmar que o cliente e o grupo recebem `Ambiente: Interno` e `Pet: não`.
5. Escrever `no caso não tenho pet` e confirmar que não surge uma segunda `NOVA SOLICITAÇÃO`.
6. Escrever `perfeito` e confirmar que a Ana informa que a equipe ainda verificará a disponibilidade.
