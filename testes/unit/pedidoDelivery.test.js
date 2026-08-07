const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarRespostaRecebimentoPedidoDelivery,
    mensagemPareceDadosDePedido,
    textoTemItemDePedido
} = require('../../core/utils/pedidoDelivery');

test('reconhece a mensagem completa observada no teste de delivery', () => {
    const mensagem = 'gustavo vale da boa esperança sitio 2 filet framboises dividido c/ roesti ao ponto';

    assert.equal(textoTemItemDePedido(mensagem), true);
    assert.equal(mensagemPareceDadosDePedido(mensagem), true);
});

test('reconhece pedido com prato, acompanhamento e ponto', () => {
    assert.equal(
        mensagemPareceDadosDePedido('quero um filet com roesti ao ponto'),
        true
    );
});

test('não transforma uma pergunta pontual de preço em pedido fechado', () => {
    assert.equal(mensagemPareceDadosDePedido('quanto custa o filet?'), false);
});

test('resposta de recebimento não confirma o pedido antes da equipe', () => {
    const resposta = criarRespostaRecebimentoPedidoDelivery();

    assert.match(resposta, /Recebi os dados do seu pedido/i);
    assert.match(resposta, /ainda confirmarão/i);
    assert.match(resposta, /finalizado somente depois dessa confirmação/i);
    assert.doesNotMatch(resposta, /não tenho essa informação/i);
});

