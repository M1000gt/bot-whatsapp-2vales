const { classificarMensagem } = require('../core/utils/classificadorMensagem');

const testes = [
    'Olá, vocês atendem hoje?',
    'Qual é o horário de funcionamento?',
    'Quanto custa?',
    'Consigo reservar para hoje às 20h?',
    'Aceita Pix?',
    'Tenho promoção de carne e frango para vender para vocês. Posso mandar tabela?',
    'Carne 88, frango 99, podemos agendar o pedido para essa semana?',
    'Sou fornecedor de bebidas, posso falar com o responsável?',
    'Segue nota fiscal para pagamento.',
    'Preciso falar com o financeiro sobre o boleto.'
];

for (const texto of testes) {
    const resultado = classificarMensagem(texto);

    console.log('\nMensagem:', texto);
    console.log('Tipo:', resultado.tipo);
    console.log('Bloquear resposta:', resultado.bloquearResposta);
    console.log('Motivo:', resultado.motivo);
}
