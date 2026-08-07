const test = require('node:test');
const assert = require('node:assert/strict');

const { obterContextoDataBrasil } = require('../../core/utils/contextoDataBrasil');

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
