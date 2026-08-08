const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarRespostaPrecoEspecialidadesInverno,
    detectarEspecialidadesMencionadas
} = require('../../core/utils/especialidadesInverno');

test('raclette informa preço total para duas pessoas e nunca por pessoa', () => {
    const resposta = criarRespostaPrecoEspecialidadesInverno(
        'A raclette custa R$ 209 por pessoa?'
    );

    assert.match(resposta, /Raclette du Valais serve duas pessoas/i);
    assert.match(resposta, /R\$ 209,00/);
    assert.match(resposta, /não por pessoa/i);
});

test('fondue de queijo e chinoise preservam preços totais diferentes', () => {
    const queijo = criarRespostaPrecoEspecialidadesInverno(
        'Qual o valor do fondue de queijo?'
    );
    const chinoise = criarRespostaPrecoEspecialidadesInverno(
        'Quanto custa o fondue de mignon?'
    );

    assert.match(queijo, /serve duas pessoas/i);
    assert.match(queijo, /R\$ 209,00/);
    assert.match(queijo, /não por pessoa/i);
    assert.match(chinoise, /serve duas pessoas/i);
    assert.match(chinoise, /R\$ 239,00/);
    assert.match(chinoise, /não por pessoa/i);
});

test('pergunta genérica sobre fondue apresenta as duas opções para o casal', () => {
    const resposta = criarRespostaPrecoEspecialidadesInverno(
        'Quais os preços dos fondues e eles servem quantas pessoas?'
    );

    assert.match(resposta, /Fondue chinoise de mignon: R\$ 239,00/i);
    assert.match(resposta, /Fondue de queijo: R\$ 209,00/i);
    assert.match(resposta, /prato completo para duas pessoas/i);
    assert.match(resposta, /não por pessoa/i);
});

test('detecção aceita grafia raclete e não intercepta pergunta de acompanhamento', () => {
    assert.deepEqual(
        detectarEspecialidadesMencionadas('qual o valor da raclete?'),
        ['raclette']
    );
    assert.equal(
        criarRespostaPrecoEspecialidadesInverno('o que acompanha a raclette?'),
        null
    );
    assert.equal(
        criarRespostaPrecoEspecialidadesInverno('qual o preço do lapin?'),
        null
    );
});

