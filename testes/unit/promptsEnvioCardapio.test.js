const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function carregar(...partes) {
    return fs.readFileSync(path.join(__dirname, '..', '..', ...partes), 'utf8');
}

test('prompt proíbe PDF automático em dúvida pontual sobre um prato', () => {
    const regras = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'Regras.txt');
    const cardapio = carregar('ChatBot', 'ana', 'Prompts', 'Negocio', 'Cardapio.txt');

    assert.match(regras, /preço de um prato específico/i);
    assert.match(regras, /deve esperar o cliente dizer que deseja recebê-lo/i);
    assert.match(cardapio, /responda com os dados oficiais abaixo e não use \[\[ENVIAR_CARDAPIO\]\]/i);
});
