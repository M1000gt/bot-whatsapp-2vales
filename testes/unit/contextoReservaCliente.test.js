const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarContextoReservaCliente,
    criarRespostaCorrecaoDataRelativa,
    criarRespostaDataReservaInvalida,
    detectarAmbiente,
    detectarDataReserva,
    detectarDataPorDiaSemana,
    detectarIntencaoPet,
    validarDataResolvidaParaReserva
} = require('../../core/utils/contextoReservaCliente');

const reservaInterpretadaErrado = `Nome: Gustavo Teste
Data: 07/08/2026
Horário: 20h
Quantidade de pessoas: 8
Ambiente: Externo
Pet: sim
Observações:`;

test('entende "neo tenho pet" como uma negação clara', () => {
    assert.equal(detectarIntencaoPet('neo tenho pet, pode ser às 20hrs'), false);
    assert.equal(detectarIntencaoPet('no caso nao tenho pet'), false);
    assert.equal(detectarIntencaoPet('tenho pet'), true);
});

test('reconcilia o erro do modelo e preserva o ambiente interno pedido pelo cliente', () => {
    const contexto = criarContextoReservaCliente();

    contexto.atualizar('cliente-1', 'gustavo teste 8 pessoas na interna', 1000);
    contexto.atualizar('cliente-1', 'neo tenho pet, pode ser as 20hrs', 2000);

    const resultado = contexto.reconciliar('cliente-1', reservaInterpretadaErrado, 3000);

    assert.match(resultado.dadosReserva, /Ambiente: Interno/);
    assert.match(resultado.dadosReserva, /Pet: não/);
    assert.equal(resultado.alterado, true);
});

test('pet confirmado força o ambiente externo mesmo se o bloco vier interno', () => {
    const contexto = criarContextoReservaCliente();
    const bloco = reservaInterpretadaErrado
        .replace('Ambiente: Externo', 'Ambiente: Interno')
        .replace('Pet: sim', 'Pet: não');

    contexto.atualizar('cliente-2', 'vou levar meu cachorro', 1000);
    const resultado = contexto.reconciliar('cliente-2', bloco, 2000);

    assert.match(resultado.dadosReserva, /Ambiente: Externo/);
    assert.match(resultado.dadosReserva, /Pet: sim/);
});

test('reconhece formas usuais de ambiente', () => {
    assert.equal(detectarAmbiente('quero na interna'), 'Interno');
    assert.equal(detectarAmbiente('prefiro a área externa'), 'Externo');
    assert.equal(detectarAmbiente('pode ser a sala reservada?'), 'Sala VIP');
});

test('guarda a próxima quinta-feira e corrige data passada no bloco e na resposta', () => {
    const contexto = criarContextoReservaCliente();
    const sexta = new Date('2026-08-07T22:00:00.000Z').getTime();
    const blocoComOntem = reservaInterpretadaErrado.replace(
        'Data: 07/08/2026',
        'Data: 06/08/2026 (quinta-feira)'
    );

    assert.equal(
        detectarDataPorDiaSemana('reserva para quinta-feira', new Date(sexta)),
        '13/08/2026 (quinta-feira)'
    );

    contexto.atualizar('cliente-3', 'quero fazer uma reserva para quinta-feira', sexta);
    const resultado = contexto.reconciliar('cliente-3', blocoComOntem, sexta + 1000);
    const resposta = contexto.corrigirDataNaResposta(
        'cliente-3',
        'Sua reserva para 06/08/2026 será encaminhada.',
        sexta + 2000
    );

    assert.match(resultado.dadosReserva, /Data: 13\/08\/2026 \(quinta-feira\)/);
    assert.equal(resultado.alterado, true);
    assert.equal(resposta, 'Sua reserva para 13/08/2026 será encaminhada.');
});

test('bloqueia reserva com data passada antes do aviso ao grupo', () => {
    const contexto = criarContextoReservaCliente();
    const sexta = new Date('2026-08-07T22:00:00.000Z').getTime();

    contexto.atualizar('cliente-4', 'quero reservar para 06/08/2026', sexta);
    const resultado = contexto.reconciliar('cliente-4', reservaInterpretadaErrado, sexta + 1000);

    assert.equal(resultado.validacaoData.aceita, false);
    assert.equal(resultado.validacaoData.motivo, 'data-passada');
    assert.match(
        criarRespostaDataReservaInvalida(resultado.validacaoData),
        /data já passou/i
    );
});

test('bloqueia reserva em dia fechado e informa a data exata', () => {
    const contexto = criarContextoReservaCliente();
    const sexta = new Date('2026-08-07T22:00:00.000Z').getTime();

    contexto.atualizar('cliente-5', 'quero reservar para segunda-feira', sexta);
    const resultado = contexto.reconciliar('cliente-5', reservaInterpretadaErrado, sexta + 1000);
    const resposta = criarRespostaDataReservaInvalida(resultado.validacaoData);

    assert.equal(resultado.validacaoData.aceita, false);
    assert.equal(resultado.validacaoData.motivo, 'restaurante-fechado');
    assert.match(resposta, /10\/08\/2026 \(segunda-feira\)/);
});

test('validação imediata barra data inexistente sem depender do bloco da IA', () => {
    const sexta = new Date('2026-08-07T22:00:00.000Z');
    const data = detectarDataReserva('reserva para 31/02/2027', sexta);
    const validacao = validarDataResolvidaParaReserva(data);

    assert.equal(validacao.aceita, false);
    assert.equal(validacao.motivo, 'data-inexistente');
});

test('corrige domingo para o outro domingo e mantém a correção se repetida', () => {
    const contexto = criarContextoReservaCliente();
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();

    const inicial = contexto.atualizar(
        'cliente-domingo',
        'quero fazer uma reserva para domingo que vem',
        sabado
    );
    const correcao = contexto.atualizar(
        'cliente-domingo',
        'no caso no outro domingo',
        sabado + 1000
    );
    const repeticao = contexto.atualizar(
        'cliente-domingo',
        'sem ser nesse domingo no outro',
        sabado + 2000
    );

    assert.equal(inicial.dataResolvida.data, '09/08/2026');
    assert.equal(correcao.dataAnteriorResolvida.data, '09/08/2026');
    assert.equal(correcao.dataResolvida.data, '16/08/2026');
    assert.equal(correcao.correcaoDataRelativa, true);
    assert.match(
        criarRespostaCorrecaoDataRelativa(correcao),
        /não será para 09\/08\/2026, e sim para 16\/08\/2026/i
    );
    assert.equal(repeticao.dataResolvida.data, '16/08/2026');
    assert.equal(repeticao.correcaoDataRelativa, false);
    assert.equal(repeticao.reafirmacaoDataRelativa, true);
    assert.match(
        criarRespostaCorrecaoDataRelativa(repeticao),
        /data continua sendo 16\/08\/2026/i
    );
});

test('corrige e reafirma outra quinta sem texto fixo de domingo', () => {
    const contexto = criarContextoReservaCliente();
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();

    contexto.atualizar('cliente-quinta', 'quero reservar para quinta-feira', sabado);
    const correcao = contexto.atualizar(
        'cliente-quinta',
        'não nessa quinta, na outra quinta',
        sabado + 1000
    );
    const repeticao = contexto.atualizar(
        'cliente-quinta',
        'isso, a outra quinta-feira',
        sabado + 2000
    );

    assert.equal(correcao.dataAnteriorResolvida.data, '13/08/2026');
    assert.equal(correcao.dataResolvida.data, '20/08/2026');
    assert.equal(correcao.correcaoDataRelativa, true);
    assert.match(criarRespostaCorrecaoDataRelativa(correcao), /20\/08\/2026 \(quinta-feira\)/i);
    assert.doesNotMatch(criarRespostaCorrecaoDataRelativa(correcao), /domingo posterior/i);
    assert.equal(repeticao.dataResolvida.data, '20/08/2026');
    assert.equal(repeticao.reafirmacaoDataRelativa, true);
    assert.match(criarRespostaCorrecaoDataRelativa(repeticao), /data continua sendo 20\/08\/2026/i);
    assert.doesNotMatch(criarRespostaCorrecaoDataRelativa(repeticao), /domingo posterior/i);
});

test('resolve o caso real "sem ser nesse domingo no outro" já na primeira mensagem', () => {
    const contexto = criarContextoReservaCliente();
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();
    const resultado = contexto.atualizar(
        'cliente-caso-real',
        'quero fazer uma reserva sem ser nesse domingo no outro',
        sabado
    );

    assert.equal(resultado.dataResolvida.data, '16/08/2026');
    assert.equal(resultado.dataResolvida.diaSemana, 'domingo');
    assert.equal(resultado.dataResolvida.horario, '12h às 17h');
    assert.equal(resultado.operacaoDataRelativa.ocorrenciaAlvo, 2);
    assert.match(
        criarRespostaCorrecaoDataRelativa(resultado),
        /16\/08\/2026 \(domingo\).+12h às 17h/i
    );
});

test('repetir o outro mantém a segunda ocorrência e avanço explícito chega à terceira', () => {
    const contexto = criarContextoReservaCliente();
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();

    const segunda = contexto.atualizar(
        'cliente-ocorrencias',
        'quero reservar no outro domingo',
        sabado
    );
    const repetida = contexto.atualizar(
        'cliente-ocorrencias',
        'sem ser esse o outro',
        sabado + 1000
    );
    const terceira = contexto.atualizar(
        'cliente-ocorrencias',
        'mais um depois desse',
        sabado + 2000
    );
    const terceiraOrdinal = contexto.atualizar(
        'cliente-ocorrencias',
        'terceiro domingo',
        sabado + 3000
    );

    assert.equal(segunda.dataResolvida.data, '16/08/2026');
    assert.equal(repetida.dataResolvida.data, '16/08/2026');
    assert.equal(repetida.reafirmacaoDataRelativa, true);
    assert.equal(terceira.dataResolvida.data, '23/08/2026');
    assert.equal(terceira.operacaoDataRelativa.ocorrenciaAlvo, 3);
    assert.equal(terceiraOrdinal.dataResolvida.data, '23/08/2026');
    assert.equal(terceiraOrdinal.reafirmacaoDataRelativa, true);
});

test('permite voltar da terceira para a primeira ocorrência', () => {
    const contexto = criarContextoReservaCliente();
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();

    contexto.atualizar('cliente-volta', 'quero reservar no terceiro domingo', sabado);
    const retorno = contexto.atualizar(
        'cliente-volta',
        'nesse domingo mesmo',
        sabado + 1000
    );

    assert.equal(retorno.dataResolvida.data, '09/08/2026');
    assert.equal(retorno.operacaoDataRelativa.ocorrenciaAlvo, 1);
});

test('mantém a base estritamente futura quando hoje já é o dia citado', () => {
    const contexto = criarContextoReservaCliente();
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();

    const primeiraFutura = contexto.atualizar(
        'cliente-sabado',
        'quero reservar sábado que vem',
        sabado
    );
    const segundaFutura = contexto.atualizar(
        'cliente-sabado',
        'outro sábado',
        sabado + 1000
    );

    assert.equal(primeiraFutura.dataResolvida.data, '15/08/2026');
    assert.equal(segundaFutura.dataResolvida.data, '22/08/2026');
});

test('ocorrências relativas atravessam mês e ano e preservam o dia correto', () => {
    const contexto = criarContextoReservaCliente();
    const domingo = new Date('2026-12-27T15:00:00.000Z').getTime();

    const segunda = contexto.atualizar(
        'cliente-virada',
        'quero reservar na outra quinta-feira',
        domingo
    );
    const terceira = contexto.atualizar(
        'cliente-virada',
        'mais uma depois dessa',
        domingo + 1000
    );

    assert.equal(segunda.dataResolvida.data, '07/01/2027');
    assert.equal(terceira.dataResolvida.data, '14/01/2027');
    assert.equal(terceira.dataResolvida.diaSemana, 'quinta-feira');
});

test('segunda ocorrência de dia fechado continua bloqueada e pode ser limpa', () => {
    const contexto = criarContextoReservaCliente();
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();
    const resultado = contexto.atualizar(
        'cliente-fechado',
        'quero reservar na outra segunda-feira',
        sabado
    );

    assert.equal(resultado.dataResolvida.data, '17/08/2026');
    assert.equal(resultado.dataResolvida.horario, 'FECHADO');
    assert.equal(
        validarDataResolvidaParaReserva(resultado.dataResolvida).motivo,
        'restaurante-fechado'
    );
    assert.equal(contexto.limparData('cliente-fechado', sabado + 1000), true);

    const semNovaData = contexto.reconciliar(
        'cliente-fechado',
        reservaInterpretadaErrado,
        sabado + 2000
    );
    assert.notEqual(semNovaData.campos.data, '17/08/2026 (segunda-feira)');
});

test('pergunta comum de horário não abre nem contamina o fluxo de reserva', () => {
    const contexto = criarContextoReservaCliente();
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();
    const pergunta = contexto.atualizar(
        'cliente-horario',
        'qual o horário de domingo?',
        sabado
    );
    const complemento = contexto.atualizar(
        'cliente-horario',
        'e o outro?',
        sabado + 1000
    );

    assert.equal(pergunta.dataResolvida, null);
    assert.equal(pergunta.operacaoDataRelativa, null);
    assert.equal(complemento.dataResolvida, null);
    assert.equal(complemento.operacaoDataRelativa, null);
});

test('terceira ocorrência é calculada corretamente para os sete dias', async t => {
    const sabado = new Date('2026-08-08T15:00:00.000Z').getTime();
    const casos = [
        ['domingo', '23/08/2026', '12h às 17h'],
        ['segunda-feira', '24/08/2026', 'FECHADO'],
        ['terça-feira', '25/08/2026', 'FECHADO'],
        ['quarta-feira', '26/08/2026', '12h às 22h'],
        ['quinta-feira', '27/08/2026', '12h às 22h'],
        ['sexta-feira', '28/08/2026', '12h às 23h'],
        ['sábado', '22/08/2026', '12h às 23h']
    ];

    for (const [dia, dataEsperada, horarioEsperado] of casos) {
        await t.test(dia, () => {
            const contexto = criarContextoReservaCliente();
            const resultado = contexto.atualizar(
                `cliente-terceira-${dia}`,
                `quero reservar no terceiro ${dia}`,
                sabado
            );

            assert.equal(resultado.dataResolvida.data, dataEsperada);
            assert.equal(resultado.dataResolvida.diaSemana, dia);
            assert.equal(resultado.dataResolvida.horario, horarioEsperado);
            assert.equal(resultado.operacaoDataRelativa.ocorrenciaAlvo, 3);
        });
    }
});
