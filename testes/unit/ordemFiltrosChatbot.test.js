const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatbotPath = path.join(__dirname, '..', '..', 'ChatBot', 'chatbot.js');

test('handoff e filtro administrativo rodam antes de alterar estados da conversa', () => {
    const fonte = fs.readFileSync(chatbotPath, 'utf8');
    const indiceHandoff = fonte.indexOf(
        'if (atendimentoHumanoAtivo(message.from) || handoffAutomaticoAtivo(message.from))'
    );
    const indiceAdministrativo = fonte.indexOf(
        'if (pareceMensagemAdministrativa(msg))'
    );
    const indiceReserva = fonte.indexOf(
        'const contextoReservaAtualizado = contextoReservaCliente.atualizar('
    );
    const indiceDelivery = fonte.indexOf(
        'if (textoIniciaDelivery(message.body))'
    );

    assert.ok(indiceHandoff >= 0);
    assert.ok(indiceAdministrativo > indiceHandoff);
    assert.ok(indiceReserva > indiceAdministrativo);
    assert.ok(indiceDelivery > indiceAdministrativo);
});

test('chatbot usa a função compartilhada de data e hora', () => {
    const fonte = fs.readFileSync(chatbotPath, 'utf8');

    assert.match(fonte, /require\('\.\.\/core\/utils\/dataHoraBrasil'\)/);
    assert.doesNotMatch(fonte, /function dataHoraBrasil\s*\(/);
    assert.doesNotMatch(fonte, /function saudacao\s*\(/);
});
