const test = require('node:test');
const assert = require('node:assert/strict');

const {
    mensagemAutorizaEnvioCardapio
} = require('../../core/utils/intencaoCardapio');

test('autoriza pedido explícito para enviar o cardápio', () => {
    assert.equal(mensagemAutorizaEnvioCardapio('Pode me enviar o cardápio, por favor?'), true);
    assert.equal(mensagemAutorizaEnvioCardapio('Quero ver o menu completo.'), true);
});

test('autoriza resposta afirmativa curta depois de uma oferta', () => {
    assert.equal(mensagemAutorizaEnvioCardapio('Sim, pode enviar.'), true);
    assert.equal(mensagemAutorizaEnvioCardapio('Quero'), true);
});

test('não autoriza PDF em pergunta de preço de prato específico', () => {
    assert.equal(mensagemAutorizaEnvioCardapio('Quanto custa o Lapin aux marrons?'), false);
});

test('não envia apenas porque o cliente perguntou se existe cardápio', () => {
    assert.equal(mensagemAutorizaEnvioCardapio('Vocês têm cardápio?'), false);
});

test('autoriza quando o cliente pede uma visão geral dos pratos', () => {
    assert.equal(mensagemAutorizaEnvioCardapio('Quais pratos vocês têm?'), true);
});
