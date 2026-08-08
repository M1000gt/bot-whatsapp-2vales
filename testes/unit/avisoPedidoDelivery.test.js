const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarAvisoPedidoDelivery
} = require('../../core/utils/avisoPedidoDelivery');

test('aviso mostra ficha organizada antes da mensagem original e do resumo', () => {
    const aviso = criarAvisoPedidoDelivery({
        nomeContato: 'GaivottoStudio',
        contato: { telefone: '+55 (24) 99999-9999', idTecnico: null },
        dadosPedido: {
            nome: 'Gustavo',
            localidade: 'Vale da Boa Esperança, Sítio 1',
            pedido: '1 filé aux framboises, dividido, ao ponto',
            acompanhamento: 'batata roesti',
            quantidade: '1',
            observacoes: 'dividido'
        },
        textoCliente: 'mensagem bruta do cliente',
        respostaAna: 'resumo seguro da Ana'
    });

    assert.match(aviso, /Cliente no WhatsApp:\nGaivottoStudio/);
    assert.match(aviso, /Telefone:\n\+55 \(24\) 99999-9999/);
    assert.match(aviso, /Nome informado:\nGustavo/);
    assert.match(aviso, /Localidade\/endereço:\nVale da Boa Esperança, Sítio 1/);
    assert.match(aviso, /Pedido:\n1 filé aux framboises, dividido, ao ponto/);
    assert.match(aviso, /Acompanhamento:\nbatata roesti/);
    assert.ok(aviso.indexOf('DADOS INTERPRETADOS') < aviso.indexOf('Mensagem original'));
    assert.ok(aviso.indexOf('Mensagem original') < aviso.indexOf('Resumo da Ana'));
});
