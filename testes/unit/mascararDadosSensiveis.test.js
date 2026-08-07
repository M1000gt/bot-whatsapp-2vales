const test = require('node:test');
const assert = require('node:assert/strict');

const { mascararDadosSensiveis } = require('../../core/utils/mascararDadosSensiveis');

test('oculta dados sensíveis comuns sem apagar data e horário', () => {
    const entrada = [
        'CPF 123.456.789-00',
        'CNPJ 12.345.678/0001-90',
        'E-mail cliente@example.com',
        'Telefone (24) 99999-1234',
        'Data 08/08/2026 às 20h'
    ].join(' | ');

    const resultado = mascararDadosSensiveis(entrada);

    assert.doesNotMatch(resultado, /123\.456/);
    assert.doesNotMatch(resultado, /12\.345\.678/);
    assert.doesNotMatch(resultado, /cliente@example/);
    assert.doesNotMatch(resultado, /99999-1234/);
    assert.match(resultado, /08\/08\/2026 às 20h/);
});
