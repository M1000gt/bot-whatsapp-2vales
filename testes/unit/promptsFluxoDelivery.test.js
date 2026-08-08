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

test('pedido delivery e pedido para entrega abrem o mesmo fluxo', () => {
    assert.match(regras, /quero fazer um pedido delivery/i);
    assert.match(regras, /quero fazer um pedido para entrega/i);
    assert.match(regras, /significam a mesma intenção/i);
    assert.match(regras, /não significa, sozinha, que o cliente já iniciou um pedido/i);
});

test('pedido delivery usa bloco estruturado como nas reservas', () => {
    assert.match(regras, /bloco interno estruturado/i);
    assert.match(regras, /\[\[PEDIDO_DELIVERY\]\][\s\S]*Nome:/i);
    assert.match(regras, /Localidade:[\s\S]*Pedido:[\s\S]*Acompanhamento:/i);
    assert.match(regras, /Quantidade:[\s\S]*Observações:/i);
    assert.match(regras, /\[\[\/PEDIDO_DELIVERY\]\]/i);
    assert.match(regras, /Nunca use apenas o marcador solto/i);
});
