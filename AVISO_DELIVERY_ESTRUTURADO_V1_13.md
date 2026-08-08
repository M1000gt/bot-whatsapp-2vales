# Aviso de delivery estruturado — V1.13

## Objetivo

Organizar o aviso enviado ao grupo no mesmo padrão visual das reservas, sem perder a mensagem original do cliente.

## Alterações

- bloco interno estruturado com nome, localidade, pedido, acompanhamento, quantidade e observações;
- ficha interpretada aparece antes da mensagem original e do resumo da Ana;
- a mensagem original continua no aviso para conferência da equipe;
- tentativa de converter contatos `@lid` para o telefone associado usando a API disponível no `whatsapp-web.js` 1.34.7;
- se o WhatsApp não disponibilizar o telefone, o sistema informa isso e mantém o LID apenas como fallback técnico;
- fallback local para separar mensagens naturais mesmo quando o bloco estruturado vier incompleto;
- nenhum dado interpretado representa confirmação de disponibilidade, taxa, prazo ou fechamento do pedido.
