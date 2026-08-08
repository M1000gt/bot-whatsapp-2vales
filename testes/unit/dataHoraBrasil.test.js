const test = require('node:test');
const assert = require('node:assert/strict');

const {
    dataHoraBrasil,
    mesAtualBrasil,
    obterHoraBrasil
} = require('../../core/utils/dataHoraBrasil');
const saudacao = require('../../ChatBot/Utils/saudacao');

test('formata data e hora sempre no fuso de São Paulo', () => {
    const instante = new Date('2026-08-08T02:30:45.000Z');

    assert.equal(dataHoraBrasil(instante), '07/08/2026, 23:30:45');
    assert.equal(mesAtualBrasil(instante), '2026-08');
    assert.equal(obterHoraBrasil(instante), 23);
});

test('saudação usa manhã de São Paulo mesmo se o servidor estiver em outro fuso', () => {
    assert.equal(
        saudacao(new Date('2026-08-08T13:00:00.000Z')),
        'Olá, bom dia! ☀️'
    );
});

test('saudação usa tarde de São Paulo', () => {
    assert.equal(
        saudacao(new Date('2026-08-08T19:00:00.000Z')),
        'Olá, boa tarde! 🌤️'
    );
});

test('saudação usa noite de São Paulo', () => {
    assert.equal(
        saudacao(new Date('2026-08-08T22:00:00.000Z')),
        'Olá, boa noite! 🌙'
    );
});
