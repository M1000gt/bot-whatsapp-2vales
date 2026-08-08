# Prompts compartilhados

`EstiloAnaUniversal.txt` é uma referência para o fluxo universal e para futuros clientes.

Ele não é carregado pela Ana específica do 2Vales de forma intencional. O atendimento do restaurante usa os prompts versionados em `ChatBot/ana/Prompts/`, que contêm regras próprias de cardápio, reservas, delivery, pets e políticas do negócio.

Não adicione o prompt universal ao `PROMPT_ANA` sem antes comparar as regras, remover duplicações e executar a suíte de testes. Carregá-lo diretamente pode introduzir instruções conflitantes com o comportamento específico do 2Vales.
