const test = require('node:test');
const assert = require('node:assert/strict');

const enviar = require('../../ChatBot/Utils/enviar');

test('falha de forma visível quando o WhatsApp não está conectado', async () => {
    await assert.rejects(
        enviar({}, 'destino', 'mensagem'),
        /não está conectado/
    );
});

test('propaga falha do WhatsApp para o fluxo chamador', async () => {
    const client = {
        info: { wid: 'teste' },
        sendMessage: async () => {
            throw new Error('falha simulada de envio');
        }
    };

    await assert.rejects(
        enviar(client, 'destino', 'mensagem'),
        /falha simulada de envio/
    );
});

test('envia destino, conteúdo e opções quando conectado', async () => {
    const chamadas = [];
    const client = {
        info: { wid: 'teste' },
        sendMessage: async (...args) => {
            chamadas.push(args);
            return { id: 'mensagem-1' };
        }
    };

    const retorno = await enviar(client, 'destino', 'mensagem', { caption: 'legenda' });

    assert.equal(retorno.id, 'mensagem-1');
    assert.deepEqual(chamadas, [
        ['destino', 'mensagem', { caption: 'legenda' }]
    ]);
});
