const test = require('node:test');
const assert = require('node:assert/strict');

const {
    analisarDeliveryBoaLembranca,
    criarRespostaBloqueioDeliveryBoaLembranca,
    identificarPratoBoaLembranca
} = require('../../core/utils/boaLembranca');

test('identifica os três pratos atuais da Boa Lembrança', () => {
    assert.equal(identificarPratoBoaLembranca('Surpresa de Bombom'), 'Surpresa de Bombom');
    assert.equal(identificarPratoBoaLembranca('bombom de alcatra'), 'Surpresa de Bombom');
    assert.equal(identificarPratoBoaLembranca('polpetone'), 'Polpetone de Filé Mignon');
    assert.equal(identificarPratoBoaLembranca('ossobuco de vitelo'), 'Ossobuco de Vitelo');
});

test('bloqueia deterministicamente Boa Lembrança no delivery', () => {
    assert.equal(
        analisarDeliveryBoaLembranca('quero pedir o Surpresa de Bombom no delivery').bloquear,
        true
    );
    assert.equal(
        analisarDeliveryBoaLembranca('vocês entregam o Polpetone de Filé Mignon?').bloquear,
        true
    );
    assert.equal(
        analisarDeliveryBoaLembranca('prato da Boa Lembrança para entrega').bloquear,
        true
    );
});

test('não bloqueia pergunta comum nem outro prato do delivery', () => {
    assert.equal(
        analisarDeliveryBoaLembranca('quanto custa o Surpresa de Bombom?').bloquear,
        false
    );
    assert.equal(
        analisarDeliveryBoaLembranca('quero pedir outro prato no delivery').bloquear,
        false
    );
});

test('resposta determinística informa consumo exclusivo no restaurante', () => {
    const resposta = criarRespostaBloqueioDeliveryBoaLembranca('Surpresa de Bombom');

    assert.match(resposta, /exclusivo para consumo no restaurante/i);
    assert.match(resposta, /não está disponível para delivery/i);
    assert.doesNotMatch(resposta, /não tenho essa informação/i);
});

