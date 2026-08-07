const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function carregar(...partes) {
    return fs.readFileSync(path.join(__dirname, '..', '..', ...partes), 'utf8');
}

const cardapio = carregar('ChatBot', 'ana', 'Prompts', 'Negocio', 'Cardapio.txt');
const regras = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'Regras.txt');

test('cadastra Surpresa de Bombom como a terceira opção da Boa Lembrança', () => {
    assert.match(cardapio, /conta com 3 opções de pratos da Boa Lembrança/i);
    assert.match(cardapio, /Surpresa de Bombom — Boa Lembrança 2026 \/ 15 anos do 2Vales/i);
});

test('mantém descrição e preço oficiais do Surpresa de Bombom', () => {
    assert.match(cardapio, /bombom de alcatra, servido com noisette de aipim, cenoura e creme cítrico de feta/i);
    assert.match(cardapio, /Surpresa de Bombom[\s\S]*Valor: R\$ 169,00/i);
});

test('proíbe Surpresa de Bombom no delivery em todas as regras específicas', () => {
    const ocorrencias = regras.match(/Surpresa de Bombom[^\n]*delivery/gi) || [];

    assert.equal(ocorrencias.length, 2);
    assert.match(regras, /pratos da Boa Lembrança são exclusivos para consumo no restaurante/i);
});

