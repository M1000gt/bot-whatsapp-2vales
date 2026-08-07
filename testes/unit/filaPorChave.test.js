const test = require('node:test');
const assert = require('node:assert/strict');

const { criarFilaPorChave } = require('../../core/utils/filaPorChave');

test('processa mensagens da mesma conversa na ordem de chegada', async () => {
    const fila = criarFilaPorChave();
    const eventos = [];
    let liberarPrimeira;

    const bloqueio = new Promise(resolve => {
        liberarPrimeira = resolve;
    });

    const primeira = fila.executar('chat-1', async () => {
        eventos.push('inicio-1');
        await bloqueio;
        eventos.push('fim-1');
    });

    const segunda = fila.executar('chat-1', async () => {
        eventos.push('inicio-2');
        eventos.push('fim-2');
    });

    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(eventos, ['inicio-1']);

    liberarPrimeira();
    await Promise.all([primeira, segunda]);

    assert.deepEqual(eventos, ['inicio-1', 'fim-1', 'inicio-2', 'fim-2']);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(fila.quantidadePendente(), 0);
});

test('uma falha não bloqueia a próxima mensagem da conversa', async () => {
    const fila = criarFilaPorChave();
    const eventos = [];

    await assert.rejects(
        fila.executar('chat-2', async () => {
            throw new Error('falha simulada');
        }),
        /falha simulada/
    );

    await fila.executar('chat-2', async () => {
        eventos.push('processada');
    });

    assert.deepEqual(eventos, ['processada']);
});
