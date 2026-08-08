# Correção de preços da Raclette e dos Fondues — V1.16

## Regra oficial

As especialidades de inverno abaixo servem duas pessoas. O preço é o valor total do prato completo para a dupla ou casal e nunca um valor por pessoa:

- Raclette du Valais: R$ 209,00;
- Fondue chinoise de mignon: R$ 239,00;
- Fondue de queijo: R$ 209,00.

## Proteções adicionadas

- regra explícita no cardápio interno da Ana;
- rendimento e preço repetidos individualmente em cada um dos três pratos;
- resposta determinística para perguntas de preço, valor, quantidade de pessoas, casal ou valor individual;
- pergunta genérica sobre fondues apresenta as duas opções e seus preços corretos;
- perguntas de ingredientes e acompanhamentos continuam sendo respondidas normalmente pela Ana;
- testes impedem que uma alteração futura volte a tratar os valores como preço por pessoa.

## Segurança de credenciais

A revisão confirmou que o pacote original continha uma chave real da OpenAI em arquivos `.env-openai` duplicados e credenciais do dashboard em arquivos `.env-dashboard`. Esses arquivos estão ignorados no repositório atual, mas as credenciais antigas devem ser revogadas e substituídas antes da promoção para produção.

