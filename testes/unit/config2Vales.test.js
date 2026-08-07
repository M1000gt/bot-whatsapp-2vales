const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('resolve o cardápio por caminho absoluto e aceita grupo de homologação', () => {
    const configPath = require.resolve('../../ChatBot/config/config');
    const grupoAnterior = process.env.GRUPO_RESERVAS_ID;
    const cardapioAnterior = process.env.CARDAPIO_PATH;

    process.env.GRUPO_RESERVAS_ID = 'grupo-homologacao@g.us';
    process.env.CARDAPIO_PATH = '/tmp/cardapio-homologacao.pdf';
    delete require.cache[configPath];

    const config = require(configPath);

    assert.equal(config.grupoReservas, 'grupo-homologacao@g.us');
    assert.equal(config.caminhoCardapio, '/tmp/cardapio-homologacao.pdf');

    if (grupoAnterior === undefined) delete process.env.GRUPO_RESERVAS_ID;
    else process.env.GRUPO_RESERVAS_ID = grupoAnterior;

    if (cardapioAnterior === undefined) delete process.env.CARDAPIO_PATH;
    else process.env.CARDAPIO_PATH = cardapioAnterior;

    delete require.cache[configPath];

    const configPadrao = require(configPath);
    assert.equal(path.isAbsolute(configPadrao.caminhoCardapio), true);
});
