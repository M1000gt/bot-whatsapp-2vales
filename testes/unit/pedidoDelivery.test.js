const test = require('node:test');
const assert = require('node:assert/strict');

const {
    consolidarDadosPedidoDelivery,
    criarRespostaInicioPedidoDelivery,
    criarRespostaRecebimentoPedidoDelivery,
    deveSolicitarDadosIniciaisDelivery,
    extrairDadosPedidoDeliveryDaMensagem,
    mensagemPareceDadosDePedido,
    mensagemSolicitaInicioPedidoDelivery,
    textoTemItemDePedido
} = require('../../core/utils/pedidoDelivery');

test('separa os dados da mensagem natural observada na homologação', () => {
    const dados = extrairDadosPedidoDeliveryDaMensagem(
        'gustavo vale da boa esperança sitio 1 file framboise com rosti dividido ao ponto'
    );

    assert.equal(dados.nome, 'gustavo');
    assert.equal(dados.localidade, 'vale da boa esperança sitio 1');
    assert.equal(dados.pedido, 'file framboise dividido ao ponto');
    assert.equal(dados.acompanhamento, 'rosti');
    assert.equal(dados.quantidade, undefined);
});

test('preserva dados estruturados e usa a mensagem somente para campos ausentes', () => {
    const dados = consolidarDadosPedidoDelivery(
        {
            nome: 'Gustavo Teste',
            pedido: 'Filé aux framboises, ao ponto',
            acompanhamento: 'Não informado'
        },
        'gustavo vale da boa esperança 2 filet framboises com roesti ao ponto'
    );

    assert.equal(dados.nome, 'Gustavo Teste');
    assert.equal(dados.localidade, 'vale da boa esperança');
    assert.equal(dados.pedido, 'Filé aux framboises, ao ponto');
    assert.equal(dados.acompanhamento, 'roesti');
    assert.equal(dados.quantidade, '2');
});

test('reconhece pedido delivery e pedido para entrega como a mesma intenção', () => {
    assert.equal(mensagemSolicitaInicioPedidoDelivery('quero fazer um pedido delivery'), true);
    assert.equal(mensagemSolicitaInicioPedidoDelivery('quero fazer um pedido para entrega'), true);
    assert.equal(mensagemSolicitaInicioPedidoDelivery('gostaria de pedir delivery'), true);
});

test('pergunta informativa sobre delivery não abre um pedido automaticamente', () => {
    assert.equal(mensagemSolicitaInicioPedidoDelivery('vocês fazem delivery?'), false);
    assert.equal(mensagemSolicitaInicioPedidoDelivery('qual é a taxa do delivery?'), false);
});

test('pede dados iniciais apenas quando o cliente ainda não informou o prato', () => {
    assert.equal(deveSolicitarDadosIniciaisDelivery('quero fazer um pedido delivery'), true);
    assert.equal(
        deveSolicitarDadosIniciaisDelivery('quero pedir delivery: 2 filet framboises com roesti'),
        false
    );
});

test('resposta inicial coleta o pedido sem afirmar que ele foi confirmado', () => {
    const resposta = criarRespostaInicioPedidoDelivery();

    assert.match(resposta, /nome/i);
    assert.match(resposta, /localidade\/endereço/i);
    assert.match(resposta, /prato desejado/i);
    assert.match(resposta, /acompanhamento/i);
    assert.match(resposta, /quantidade/i);
    assert.match(resposta, /equipe confirmará/i);
    assert.doesNotMatch(resposta, /não tenho essa informação/i);
});

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
