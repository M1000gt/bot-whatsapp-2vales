const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarControleConfirmacaoEquipe,
    mensagemAceitaConfirmacao,
    mensagemRecusaConfirmacao
} = require('../../core/utils/confirmacaoEquipe');

test('guarda a pergunta original e recupera quando o cliente aceita', () => {
    const controle = criarControleConfirmacaoEquipe();

    controle.registrarOferta('cliente-1', 'Tem trocador para bebê?', 1000);
    const resultado = controle.interpretarResposta('cliente-1', 'sim, por favor', 2000);

    assert.equal(resultado.tipo, 'confirmada');
    assert.equal(resultado.perguntaOriginal, 'Tem trocador para bebê?');
    assert.equal(controle.interpretarResposta('cliente-1', 'sim', 3000).tipo, 'nenhuma');
});

test('recusa encerra a pendência sem avisar a equipe', () => {
    const controle = criarControleConfirmacaoEquipe();

    controle.registrarOferta('cliente-2', 'Possui cadeira infantil?', 1000);
    assert.equal(controle.interpretarResposta('cliente-2', 'não precisa', 2000).tipo, 'recusada');
    assert.equal(controle.interpretarResposta('cliente-2', 'sim', 3000).tipo, 'nenhuma');
});

test('pendência expira e respostas longas não são tratadas como aceite', () => {
    const controle = criarControleConfirmacaoEquipe({ expiracaoMs: 1000 });

    controle.registrarOferta('cliente-3', 'Tem carregador?', 1000);
    assert.equal(
        controle.interpretarResposta('cliente-3', 'sim, e também queria fazer uma reserva', 1500).tipo,
        'pendente'
    );
    assert.equal(controle.interpretarResposta('cliente-3', 'sim', 2501).tipo, 'nenhuma');
});

test('reconhece respostas afirmativas e negativas curtas', () => {
    assert.equal(mensagemAceitaConfirmacao('pode confirmar'), true);
    assert.equal(mensagemAceitaConfirmacao('sim, por favor'), true);
    assert.equal(mensagemRecusaConfirmacao('não, obrigado'), true);
    assert.equal(mensagemAceitaConfirmacao('sim, quero reservar para amanhã'), false);
});

