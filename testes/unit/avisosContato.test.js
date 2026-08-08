const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatbot = fs.readFileSync(
    path.join(__dirname, '..', '..', 'ChatBot', 'chatbot.js'),
    'utf8'
);

test('todos os avisos da Ana usam o resolvedor comum de contato', () => {
    const titulos = [
        'MENSAGEM ADMINISTRATIVA / FORNECEDOR',
        'CLIENTE PEDIU CONFIRMAÇÃO DE UMA INFORMAÇÃO',
        'CLIENTE SOLICITOU ATENDIMENTO HUMANO',
        'NOVA SOLICITAÇÃO DE RESERVA VIA ANA',
        'ATUALIZAÇÃO DE SOLICITAÇÃO DE RESERVA VIA ANA'
    ];

    assert.match(chatbot, /obterContatoParaAviso/);
    assert.match(chatbot, /criarBlocoContatoAviso/);

    for (const titulo of titulos) {
        assert.match(chatbot, new RegExp(titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.doesNotMatch(chatbot, /📱 (?:Número|Contato\/ID):\s*\n\$\{message\.from\}/);
});
