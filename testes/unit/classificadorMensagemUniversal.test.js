const test = require('node:test');
const assert = require('node:assert/strict');

const { classificarMensagem } = require('../../core/utils/classificadorMensagem');

test('abreviação NF isolada continua sendo administrativa', () => {
    const resultado = classificarMensagem('Segue a NF para o financeiro.');

    assert.equal(resultado.tipo, 'ADMINISTRATIVO');
    assert.equal(resultado.bloquearResposta, true);
});

test('NF como parte de outra palavra não bloqueia clientes', () => {
    const mensagens = [
        'Posso confirmar minha reserva para sexta?',
        'Gostaria de mais informações sobre o cardápio.',
        'Vocês têm cardápio infantil?'
    ];

    for (const mensagem of mensagens) {
        assert.equal(
            classificarMensagem(mensagem).bloquearResposta,
            false,
            mensagem
        );
    }
});

test('sinais claros de fornecedor continuam bloqueados', () => {
    assert.equal(
        classificarMensagem('Sou fornecedor e quero vender para vocês.')
            .bloquearResposta,
        true
    );
});
