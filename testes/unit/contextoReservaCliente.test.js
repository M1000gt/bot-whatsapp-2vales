const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarContextoReservaCliente,
    detectarAmbiente,
    detectarIntencaoPet
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

