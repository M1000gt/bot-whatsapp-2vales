const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const regrasPath = path.join(
    __dirname,
    '..',
    '..',
    'ChatBot',
    'ana',
    'Prompts',
    'Operacao',
    'Regras.txt'
);

const anaPath = path.join(
    __dirname,
    '..',
    '..',
    'ChatBot',
    'ana',
    'Ana.js'
);

test('prompt não contém exemplo fixo que transforma toda pergunta sobre hoje em 22h', () => {
    const regras = fs.readFileSync(regrasPath, 'utf8');

    assert.doesNotMatch(regras, /Hoje funcionamos das 12h às 22h/i);
    assert.match(regras, /HORÁRIO OFICIAL DE HOJE/);
});

test('prompt usa calendário futuro e proíbe data passada em nova reserva', () => {
    const regras = fs.readFileSync(regrasPath, 'utf8');
    const ana = fs.readFileSync(anaPath, 'utf8');

    assert.match(regras, /primeira ocorrência que seja hoje ou futura/i);
    assert.match(regras, /Nunca atribua à reserva uma data que já passou/i);
    assert.match(ana, /CALENDÁRIO OFICIAL — HOJE E PRÓXIMOS 14 DIAS/i);
    assert.match(ana, /Nunca escolha uma data que já passou/i);
});

test('prompt diferencia este domingo do outro domingo', () => {
    const regras = fs.readFileSync(regrasPath, 'utf8');
    const ana = fs.readFileSync(anaPath, 'utf8');

    assert.match(regras, /outro domingo/i);
    assert.match(regras, /outra quinta/i);
    assert.match(regras, /todos os sete dias/i);
    assert.match(regras, /ocorrência imediatamente posterior/i);
    assert.match(regras, /nunca pode voltar da segunda ocorrência para a primeira/i);
    assert.match(ana, /PRÓXIMOS 14 DIAS/i);
    assert.match(ana, /todos os sete dias/i);
});
