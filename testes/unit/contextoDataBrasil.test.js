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
