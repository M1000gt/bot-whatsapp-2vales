const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarControleEncaminhamentoReserva,
    criarRespostaCortesiaReserva,
    criarRespostaSeguraReserva,
    mensagemEhCortesiaAposReserva
} = require('../../core/utils/controleEncaminhamentoReserva');

const reservaInterna = `Nome: Gustavo Teste
Data: 07/08/2026
Horário: 20h
Quantidade de pessoas: 8
Ambiente: Interno
Pet: não
Observações:`;

test('classifica primeiro envio, repetição e correção da mesma conversa', () => {
    const controle = criarControleEncaminhamentoReserva();

    assert.equal(controle.registrar('cliente-1', reservaInterna, 1000).tipo, 'nova');
    assert.equal(controle.registrar('cliente-1', reservaInterna, 2000).tipo, 'duplicada');

    const corrigida = reservaInterna.replace('Ambiente: Interno', 'Ambiente: Externo');
    assert.equal(controle.registrar('cliente-1', corrigida, 3000).tipo, 'atualizacao');
});

test('considera uma solicitação nova depois da expiração', () => {
    const controle = criarControleEncaminhamentoReserva({ expiracaoMs: 1000 });

    assert.equal(controle.registrar('cliente-2', reservaInterna, 1000).tipo, 'nova');
    assert.equal(controle.registrar('cliente-2', reservaInterna, 2501).tipo, 'nova');
});

test('reconhece cortesia curta depois da solicitação', () => {
    assert.equal(mensagemEhCortesiaAposReserva('perfeito'), true);
    assert.equal(mensagemEhCortesiaAposReserva('muito obrigado!'), true);
    assert.equal(mensagemEhCortesiaAposReserva('a reserva está confirmada?'), false);
});

test('respostas seguras deixam explícito que a equipe ainda precisa confirmar', () => {
    const respostaAtualizacao = criarRespostaSeguraReserva(reservaInterna, 'atualizacao');
    const respostaCortesia = criarRespostaCortesiaReserva();

    assert.match(respostaAtualizacao, /correção foi encaminhada/i);
    assert.match(respostaAtualizacao, /ainda depende da confirmação/i);
    assert.match(respostaCortesia, /ainda depende da confirmação/i);
    assert.doesNotMatch(respostaCortesia, /reserva confirmada/i);
});

