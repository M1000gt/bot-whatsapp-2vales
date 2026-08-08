const test = require('node:test');
const assert = require('node:assert/strict');

const {
    extrairCamposPedidoDelivery,
    interpretarRespostaAna,
    reservaTemDadosMinimos
} = require('../../core/utils/acoesAna');

test('extrai pedido delivery estruturado e não vaza o bloco interno', () => {
    const resposta = `Recebi o pedido e vou encaminhar.
[[PEDIDO_DELIVERY]]
Nome: Gustavo
Localidade: Vale da Boa Esperança, Sítio 1
Pedido: 1 filé aux framboises, dividido, ao ponto
Acompanhamento: batata roesti
Quantidade: 1
Observações: dividido
[[/PEDIDO_DELIVERY]]`;
    const resultado = interpretarRespostaAna(resposta);

    assert.equal(resultado.acoes.pedidoDelivery, true);
    assert.equal(resultado.acoes.dadosPedidoDelivery.nome, 'Gustavo');
    assert.equal(
        resultado.acoes.dadosPedidoDelivery.localidade,
        'Vale da Boa Esperança, Sítio 1'
    );
    assert.equal(resultado.acoes.dadosPedidoDelivery.acompanhamento, 'batata roesti');
    assert.equal(resultado.textoCliente, 'Recebi o pedido e vou encaminhar.');
    assert.doesNotMatch(resultado.textoCliente, /PEDIDO_DELIVERY|Localidade:/i);
    assert.deepEqual(
        extrairCamposPedidoDelivery('Prato: massa\nEndereço: Itaipava'),
        { pedido: 'massa', localidade: 'Itaipava' }
    );
});

test('bloco delivery incompleto também não vaza conteúdo interno', () => {
    const resultado = interpretarRespostaAna(`Vou encaminhar o pedido.
[[PEDIDO_DELIVERY]]
Nome: Gustavo
Localidade: Itaipava`);

    assert.equal(resultado.textoCliente, 'Vou encaminhar o pedido.');
    assert.equal(resultado.acoes.pedidoDelivery, true);
    assert.equal(resultado.acoes.dadosPedidoDelivery, null);
});

test('remove marcadores internos e preserva o texto do cliente', () => {
    const resultado = interpretarRespostaAna(
        'Claro, vou enviar agora.\n[[ENVIAR_CARDAPIO]]\n[[MARCADOR_DESCONHECIDO]]'
    );

    assert.equal(resultado.textoCliente, 'Claro, vou enviar agora.');
    assert.equal(resultado.acoes.enviarCardapio, true);
});

test('aceita reserva somente com os campos mínimos preenchidos', () => {
    const resposta = `Recebi seus dados e vou encaminhar.
[[RESERVA_COMPLETA]]
Nome: Maria
Data: 08/08/2026
Horário: 20h
Quantidade de pessoas: 4
Ambiente: externo
Pet: não
Observações: aniversário
[[/RESERVA_COMPLETA]]`;

    const resultado = interpretarRespostaAna(resposta);

    assert.equal(resultado.acoes.reservaCompleta, true);
    assert.match(resultado.acoes.dadosReserva, /Nome: Maria/);
    assert.doesNotMatch(resultado.textoCliente, /RESERVA_COMPLETA/);
});

test('não dispara reserva incompleta e não vaza o bloco interno', () => {
    const resposta = `Ainda preciso do horário.
[[RESERVA_COMPLETA]]
Nome: Maria
Data: 08/08/2026
Horário: ...
Quantidade de pessoas: 4
Ambiente: externo
[[/RESERVA_COMPLETA]]`;

    const resultado = interpretarRespostaAna(resposta);

    assert.equal(resultado.acoes.reservaCompleta, false);
    assert.equal(resultado.acoes.dadosReserva, null);
    assert.equal(resultado.textoCliente, 'Ainda preciso do horário.');
    assert.equal(reservaTemDadosMinimos('Nome: ...'), false);
});

test('tolera resposta nula sem derrubar o fluxo', () => {
    const resultado = interpretarRespostaAna(null);

    assert.equal(resultado.textoCliente, '');
    assert.equal(resultado.acoes.enviarCardapio, false);
    assert.equal(resultado.acoes.reservaCompleta, false);
});

test('remove marcador mesmo se o modelo alterar maiúsculas e minúsculas', () => {
    const resultado = interpretarRespostaAna('Vou chamar a equipe. [[chamar_atendente]]');

    assert.equal(resultado.textoCliente, 'Vou chamar a equipe.');
    assert.equal(resultado.acoes.chamarAtendente, true);
});

test('interpreta marcadores de oferta e confirmação com a equipe', () => {
    const oferta = interpretarRespostaAna(
        'Não tenho essa informação confirmada. Posso consultar? [[OFERECER_CONFIRMACAO_EQUIPE]]'
    );
    const confirmacao = interpretarRespostaAna(
        'Vou encaminhar sua dúvida. [[CONFIRMAR_COM_EQUIPE]]'
    );

    assert.equal(oferta.acoes.oferecerConfirmacaoEquipe, true);
    assert.equal(oferta.acoes.confirmarComEquipe, false);
    assert.doesNotMatch(oferta.textoCliente, /OFERECER_CONFIRMACAO/);
    assert.equal(confirmacao.acoes.confirmarComEquipe, true);
    assert.doesNotMatch(confirmacao.textoCliente, /CONFIRMAR_COM_EQUIPE/);
});
