const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarAvisoPedidoDelivery,
    formatarTelefone,
    resolverContatoExibicao
} = require('../../core/utils/avisoPedidoDelivery');

test('formata números brasileiros recebidos como c.us', () => {
    assert.equal(formatarTelefone('5524999999999@c.us'), '+55 (24) 99999-9999');
    assert.equal(formatarTelefone('552422222222@c.us'), '+55 (24) 2222-2222');
});

test('converte LID em telefone quando o WhatsApp disponibiliza a relação', async () => {
    const client = {
        getContactLidAndPhone: async () => [{
            lid: '227062824616174@lid',
            pn: '5524999999999@c.us'
        }],
        getFormattedNumber: async () => '+55 24 99999-9999'
    };
    const contato = await resolverContatoExibicao(
        client,
        '227062824616174@lid'
    );

    assert.equal(contato.telefone, '+55 24 99999-9999');
    assert.equal(contato.idTecnico, null);
});

test('mantém o LID apenas como fallback quando o telefone não está disponível', async () => {
    const client = {
        getContactLidAndPhone: async () => []
    };
    const contato = await resolverContatoExibicao(
        client,
        '227062824616174@lid'
    );

    assert.equal(contato.telefone, 'Não disponibilizado pelo WhatsApp');
    assert.equal(contato.idTecnico, '227062824616174@lid');
});

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
