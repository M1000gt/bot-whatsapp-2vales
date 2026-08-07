const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function carregar(...partes) {
    return fs.readFileSync(path.join(__dirname, '..', '..', ...partes), 'utf8');
}

const reservas = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'Reservas.txt');
const validacoes = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'Validacoes.txt');

test('prompt trata negação e erro comum de digitação sobre pet', () => {
    assert.match(reservas, /"neo tenho pet" significam Pet: não/i);
    assert.match(reservas, /negação sempre prevalece/i);
});

test('correção posterior regenera o bloco completo para atualização', () => {
    assert.match(reservas, /corrigir pet, ambiente, data, horário, quantidade ou nome/i);
    assert.match(reservas, /sistema tratará isso como atualização/i);
});

test('prompt proíbe confirmação implícita depois do encaminhamento', () => {
    assert.match(reservas, /reserva ainda depende da confirmação de disponibilidade/i);
    assert.match(reservas, /Nunca diga "está tudo certo"/i);
    assert.match(validacoes, /solicitação encaminhada ainda não é uma reserva confirmada/i);
});

