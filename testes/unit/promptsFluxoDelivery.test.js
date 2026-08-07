const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const regras = fs.readFileSync(
    path.join(__dirname, '..', '..', 'ChatBot', 'ana', 'Prompts', 'Operacao', 'Regras.txt'),
    'utf8'
);

test('pedido de delivery tem prioridade sobre informação não cadastrada', () => {
    assert.match(regras, /fluxo de pedido de delivery tem prioridade/i);
    assert.match(regras, /nunca deve responder "não tenho essa informação confirmada"/i);
    assert.match(regras, /reconhecer os dados recebidos e encaminhar o pedido/i);
});

