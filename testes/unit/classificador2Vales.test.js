const test = require('node:test');
const assert = require('node:assert/strict');

const { classificarMensagem2Vales } = require('../../core/utils/classificador2Vales');

const clientes = [
    'Aceita pagamento em Pix?',
    'Quero fazer um contrato para um evento de casamento.',
    'Preciso levar algum documento para reservar?',
    'Vocês fazem delivery?',
    'Posso pedir um prato para entrega?',
    'Qual é o valor do serviço de vinho?',
    'Quero uma reserva para sexta às 20h.'
];

const administrativos = [
    'Sou fornecedor de bebidas e quero falar com o responsável.',
    'Segue a nota fiscal para pagamento.',
    'Posso mandar a tabela de preços para vocês?',
    'Tenho promoção de carne para vender ao restaurante.',
    'Vim fazer a entrega de mercadoria.'
];

for (const mensagem of clientes) {
    test(`mantém como cliente: ${mensagem}`, () => {
        assert.equal(classificarMensagem2Vales(mensagem).bloquearResposta, false);
    });
}

for (const mensagem of administrativos) {
    test(`bloqueia administrativo: ${mensagem}`, () => {
        assert.equal(classificarMensagem2Vales(mensagem).bloquearResposta, true);
    });
}
