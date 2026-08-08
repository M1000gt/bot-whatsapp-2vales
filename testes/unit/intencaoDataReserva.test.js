const test = require('node:test');
const assert = require('node:assert/strict');

const {
    detectarComandoDataRelativa
} = require('../../core/utils/intencaoDataReserva');

test('distingue segunda ocorrência idempotente de avanço explícito', () => {
    const segunda = detectarComandoDataRelativa(
        'sem ser nesse domingo, no outro'
    );
    const repeticao = detectarComandoDataRelativa(
        'sem ser esse, o outro',
        { diaSemanaAnterior: 'domingo' }
    );
    const avancar = detectarComandoDataRelativa(
        'mais um depois desse',
        { diaSemanaAnterior: 'domingo' }
    );

    assert.equal(segunda.modo, 'segunda-idempotente');
    assert.equal(segunda.ocorrenciaAlvo, 2);
    assert.equal(repeticao.ocorrenciaAlvo, 2);
    assert.equal(avancar.tipo, 'avancar-ocorrencia');
});

test('reconhece ordinal e retorno explícito para a primeira ocorrência', () => {
    assert.equal(
        detectarComandoDataRelativa('terceiro domingo').ocorrenciaAlvo,
        3
    );
    assert.equal(
        detectarComandoDataRelativa(
            'volta para o primeiro',
            { diaSemanaAnterior: 'domingo' }
        ).ocorrenciaAlvo,
        1
    );
    assert.equal(
        detectarComandoDataRelativa('nesse domingo mesmo').modo,
        'voltar-primeira'
    );
});

test('não transforma menção comum de dia ou data explícita em correção relativa', () => {
    assert.equal(detectarComandoDataRelativa('domingo que vem'), null);
    assert.equal(
        detectarComandoDataRelativa(
            'pode ser 23/08/2026',
            { diaSemanaAnterior: 'domingo' }
        ),
        null
    );
    assert.equal(
        detectarComandoDataRelativa(
            'qual o horário de domingo?',
            { diaSemanaAnterior: 'quinta-feira' }
        ),
        null
    );
    assert.equal(
        detectarComandoDataRelativa(
            'quero mais uma mesa no domingo',
            { diaSemanaAnterior: 'domingo' }
        ),
        null
    );
});
