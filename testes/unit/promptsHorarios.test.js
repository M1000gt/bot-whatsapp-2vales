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

test('prompt não contém exemplo fixo que transforma toda pergunta sobre hoje em 22h', () => {
    const regras = fs.readFileSync(regrasPath, 'utf8');

    assert.doesNotMatch(regras, /Hoje funcionamos das 12h às 22h/i);
    assert.match(regras, /HORÁRIO OFICIAL DE HOJE/);
});
