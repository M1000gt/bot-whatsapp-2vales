const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatbotPath = path.join(
    __dirname,
    '..',
    '..',
    'ChatBot',
    'chatbot.js'
);

test('chatbot valida e responde comando relativo antes de consultar a IA', () => {
    const chatbot = fs.readFileSync(chatbotPath, 'utf8');
    const indiceAtualizacao = chatbot.indexOf(
        'const contextoReservaAtualizado = contextoReservaCliente.atualizar('
    );
    const indiceOperacao = chatbot.indexOf(
        'contextoReservaAtualizado.operacaoDataRelativa &&'
    );
    const indiceOpenAI = chatbot.indexOf('const respostaOriginalAna = await falarComAna(');

    assert.ok(indiceAtualizacao >= 0);
    assert.ok(indiceOperacao > indiceAtualizacao);
    assert.ok(indiceOpenAI > indiceOperacao);
    assert.match(chatbot, /registrarInteracaoAna\([\s\S]*respostaCorrecaoData/);
});

test('correção relativa posterior gera atualização determinística no grupo', () => {
    const chatbot = fs.readFileSync(chatbotPath, 'utf8');

    assert.match(
        chatbot,
        /controleEncaminhamentoReserva\.obterReservaRecente\([\s\S]*ATUALIZAÇÃO DE SOLICITAÇÃO DE RESERVA VIA ANA/
    );
});

