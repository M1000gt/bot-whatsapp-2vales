const test = require('node:test');
const assert = require('node:assert/strict');

const {
    obterContextoDataBrasil,
    obterProximaOcorrenciaDiaSemana,
    resolverDataMencionada
} = require('../../core/utils/contextoDataBrasil');

test('usa o dia de São Paulo mesmo quando UTC já virou o dia', () => {
    const contexto = obterContextoDataBrasil(new Date('2026-08-05T01:30:00.000Z'));

    assert.equal(contexto.dataAtual, '04/08/2026');
    assert.equal(contexto.diaSemana, 'terça-feira');
    assert.equal(contexto.horaAtual, '22:30:00');
    assert.equal(contexto.abertoHoje, false);
    assert.equal(contexto.horarioHoje, 'FECHADO');
    assert.equal(contexto.dataAmanha, '05/08/2026');
    assert.equal(contexto.diaSemanaAmanha, 'quarta-feira');
    assert.equal(contexto.abertoAmanha, true);
    assert.equal(contexto.horarioAmanha, '12h às 22h');
});

test('informa o horário oficial de sexta-feira sem herdar o horário de quinta', () => {
    const contexto = obterContextoDataBrasil(new Date('2026-08-07T18:00:00.000Z'));

    assert.equal(contexto.dataAtual, '07/08/2026');
    assert.equal(contexto.diaSemana, 'sexta-feira');
    assert.equal(contexto.abertoHoje, true);
    assert.equal(contexto.horarioHoje, '12h às 23h');
    assert.equal(contexto.diaSemanaAmanha, 'sábado');
    assert.equal(contexto.horarioAmanha, '12h às 23h');
});

test('resolve quinta-feira como a próxima ocorrência futura e nunca como ontem', () => {
    const sexta = new Date('2026-08-07T22:00:00.000Z');
    const quinta = obterProximaOcorrenciaDiaSemana('quinta-feira', sexta);

    assert.equal(quinta.data, '13/08/2026');
    assert.equal(quinta.diaSemana, 'quinta-feira');
    assert.equal(quinta.horario, '12h às 22h');
});

test('diferencia o dia atual de uma próxima ocorrência explicitamente futura', () => {
    const quinta = new Date('2026-08-06T18:00:00.000Z');

    assert.equal(
        obterProximaOcorrenciaDiaSemana('quinta', quinta).data,
        '06/08/2026'
    );
    assert.equal(
        obterProximaOcorrenciaDiaSemana('quinta', quinta, { estritamenteFutura: true }).data,
        '13/08/2026'
    );
});

test('resolve hoje, amanhã e depois de amanhã no fuso de São Paulo', () => {
    const sexta = new Date('2026-08-07T22:00:00.000Z');

    assert.equal(resolverDataMencionada('hoje', sexta).data, '07/08/2026');
    assert.equal(resolverDataMencionada('amanhã', sexta).data, '08/08/2026');
    assert.equal(resolverDataMencionada('depois de amanhã', sexta).data, '09/08/2026');
});

test('resolve data sem ano para a próxima ocorrência e atravessa o ano', () => {
    const fimDoAno = new Date('2026-12-31T18:00:00.000Z');
    const resultado = resolverDataMencionada('quero para 02/01', fimDoAno);

    assert.equal(resultado.data, '02/01/2027');
    assert.equal(resultado.passada, false);
});

test('não transforma data recém-passada sem ano em reserva para o ano seguinte', () => {
    const sexta = new Date('2026-08-07T22:00:00.000Z');
    const resultado = resolverDataMencionada('quero para 06/08', sexta);

    assert.equal(resultado.data, '06/08/2026');
    assert.equal(resultado.passada, true);
});

test('identifica data explicitamente passada', () => {
    const sexta = new Date('2026-08-07T22:00:00.000Z');
    const resultado = resolverDataMencionada('reserva para 06/08/2026', sexta);

    assert.equal(resultado.valida, true);
    assert.equal(resultado.passada, true);
});

test('rejeita data inexistente sem normalizar silenciosamente', () => {
    const sexta = new Date('2026-08-07T22:00:00.000Z');
    const resultado = resolverDataMencionada('pode ser 31/02/2027?', sexta);

    assert.equal(resultado.valida, false);
    assert.equal(resultado.motivo, 'data-inexistente');
});

test('resolve expressão dia 15 para a próxima ocorrência', () => {
    const depoisDoDia = new Date('2026-08-20T18:00:00.000Z');
    const resultado = resolverDataMencionada('pode ser dia 15', depoisDoDia);

    assert.equal(resultado.data, '15/09/2026');
});

test('marca segunda e terça como dias fechados', () => {
    const sexta = new Date('2026-08-07T22:00:00.000Z');
    const resultado = resolverDataMencionada('segunda-feira', sexta);

    assert.equal(resultado.data, '10/08/2026');
    assert.equal(resultado.aberto, false);
    assert.equal(resultado.horario, 'FECHADO');
});

test('distingue este domingo do outro domingo sem inverter as datas', () => {
    const sabado = new Date('2026-08-08T15:00:00.000Z');

    assert.equal(
        resolverDataMencionada('domingo que vem', sabado).data,
        '09/08/2026'
    );
    assert.equal(
        resolverDataMencionada('no caso no outro domingo', sabado).data,
        '16/08/2026'
    );
    assert.equal(
        resolverDataMencionada('sem ser nesse domingo, no outro', sabado).data,
        '16/08/2026'
    );
    assert.equal(
        resolverDataMencionada('domingo da outra semana', sabado).data,
        '16/08/2026'
    );
    assert.equal(
        resolverDataMencionada('domingo seguinte', sabado).data,
        '16/08/2026'
    );
});

test('aplica primeira e segunda ocorrência a todos os dias da semana', async t => {
    const sabado = new Date('2026-08-08T15:00:00.000Z');
    const casos = [
        ['domingo', '09/08/2026', '16/08/2026', true],
        ['segunda-feira', '10/08/2026', '17/08/2026', false],
        ['terça-feira', '11/08/2026', '18/08/2026', false],
        ['quarta-feira', '12/08/2026', '19/08/2026', true],
        ['quinta-feira', '13/08/2026', '20/08/2026', true],
        ['sexta-feira', '14/08/2026', '21/08/2026', true],
        ['sábado', '08/08/2026', '15/08/2026', true]
    ];

    for (const [dia, primeira, segunda, aberto] of casos) {
        await t.test(dia, () => {
            const ocorrenciaInicial = resolverDataMencionada(dia, sabado);
            const outraOcorrencia = resolverDataMencionada(`na outra ${dia}`, sabado);
            const ocorrenciaDaOutraSemana = resolverDataMencionada(
                `${dia} da outra semana`,
                sabado
            );
            const correcaoNatural = resolverDataMencionada(
                `sem ser nessa ${dia}, na outra`,
                sabado
            );

            assert.equal(ocorrenciaInicial.data, primeira);
            assert.equal(ocorrenciaInicial.aberto, aberto);
            assert.equal(outraOcorrencia.data, segunda);
            assert.equal(outraOcorrencia.origem, 'outro-dia-semana');
            assert.equal(ocorrenciaDaOutraSemana.data, segunda);
            assert.equal(correcaoNatural.data, segunda);
        });
    }
});

test('diferencia dia que vem de outro dia quando hoje já é o dia citado', () => {
    const sabado = new Date('2026-08-08T15:00:00.000Z');

    assert.equal(resolverDataMencionada('sábado', sabado).data, '08/08/2026');
    assert.equal(resolverDataMencionada('sábado que vem', sabado).data, '15/08/2026');
    assert.equal(resolverDataMencionada('outro sábado', sabado).data, '15/08/2026');
});

test('segunda ocorrência atravessa mês e ano sem regredir', () => {
    const domingo = new Date('2026-12-27T15:00:00.000Z');

    assert.equal(
        resolverDataMencionada('quinta-feira', domingo).data,
        '31/12/2026'
    );
    assert.equal(
        resolverDataMencionada('outra quinta-feira', domingo).data,
        '07/01/2027'
    );
});

test('calendário oficial inclui duas semanas completas', () => {
    const sabado = new Date('2026-08-08T15:00:00.000Z');
    const contexto = obterContextoDataBrasil(sabado);

    assert.equal(contexto.calendarioProximosDias.length, 15);
    assert.equal(contexto.calendarioProximosDias[0].data, '08/08/2026');
    assert.ok(
        contexto.calendarioProximosDias.some(dia => dia.data === '16/08/2026')
    );
});

test('janela de 15 dias é móvel e não expira', () => {
    const primeiraData = obterContextoDataBrasil(
        new Date('2026-08-08T15:00:00.000Z')
    );
    const dataPosterior = obterContextoDataBrasil(
        new Date('2026-08-20T15:00:00.000Z')
    );

    assert.equal(primeiraData.calendarioProximosDias[0].data, '08/08/2026');
    assert.equal(dataPosterior.calendarioProximosDias[0].data, '20/08/2026');
    assert.equal(dataPosterior.calendarioProximosDias.at(-1).data, '03/09/2026');
});

test('resolve data explícita muito além da janela mostrada à IA', () => {
    const sabado = new Date('2026-08-08T15:00:00.000Z');
    const resultado = resolverDataMencionada(
        'quero reservar para 15/11/2026',
        sabado
    );

    assert.equal(resultado.data, '15/11/2026');
    assert.equal(resultado.diaSemana, 'domingo');
    assert.equal(resultado.passada, false);
    assert.equal(resultado.valida, true);
});
