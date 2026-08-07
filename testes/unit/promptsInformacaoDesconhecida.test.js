const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function carregar(...partes) {
    return fs.readFileSync(path.join(__dirname, '..', '..', ...partes), 'utf8');
}

const antiInvencao = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'AntiInvencao.txt');
const regras = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'Regras.txt');

test('informação não cadastrada usa fonte fechada e não permite suposição', () => {
    assert.match(antiInvencao, /trabalha com fonte fechada/i);
    assert.match(antiInvencao, /Nunca complete com conhecimento geral, suposição/i);
    assert.match(regras, /não deve adivinhar nem usar conhecimento geral/i);
});

test('oferta e pedido direto usam marcadores diferentes', () => {
    assert.match(antiInvencao, /\[\[OFERECER_CONFIRMACAO_EQUIPE\]\]/);
    assert.match(antiInvencao, /\[\[CONFIRMAR_COM_EQUIPE\]\]/);
    assert.match(regras, /Não confundir esse fluxo com pedido para conversar com um atendente/i);
});

