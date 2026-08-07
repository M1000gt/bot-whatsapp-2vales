const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function carregar(...partes) {
    return fs.readFileSync(path.join(__dirname, '..', '..', ...partes), 'utf8');
}

const regras = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'Regras.txt');
const reservas = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'Reservas.txt');
const validacoes = carregar('ChatBot', 'ana', 'Prompts', 'Operacao', 'Validacoes.txt');
const pets = carregar('ChatBot', 'ana', 'Prompts', 'Negocio', 'Pets.txt');
const cardapio = carregar('ChatBot', 'ana', 'Prompts', 'Negocio', 'Cardapio.txt');

test('permite somente preços exatos cadastrados no cardápio oficial', () => {
    assert.match(regras, /pode informar o preço exato/i);
    assert.match(regras, /nome e o valor estiverem escritos no CARDÁPIO OFICIAL/i);
    assert.doesNotMatch(regras, /A Ana NUNCA deve informar, sugerir, estimar ou inventar valores/i);
    assert.match(cardapio, /R\$\s*\d+/);
});

test('diferencia preço oficial de orçamento personalizado', () => {
    assert.match(regras, /proposta personalizada, a Ana não deve criar preço/i);
    assert.match(regras, /Preço oficial cadastrado pode ser informado/i);
});

test('identifica a área local de delivery sem confundir com Cuiabá-MT', () => {
    assert.match(regras, /Vale do Cuiabá e localidades próximas na região de Itaipava, em Petrópolis/i);
    assert.match(regras, /Santo Antônio/i);
    assert.doesNotMatch(regras, /delivery (?:apenas para|atende) Cuiabá e região/i);
});

test('Sala VIP nunca é oferecida espontaneamente e depende da equipe', () => {
    assert.match(regras, /nunca deve mencioná-la, oferecê-la ou sugeri-la espontaneamente/i);
    assert.match(regras, /comporta no máximo 14 pessoas/i);
    assert.match(regras, /use o marcador interno \[\[CHAMAR_ATENDENTE\]\]/i);
    assert.doesNotMatch(regras, /mencionar que a Sala VIP pode ser uma excelente opção/i);
    assert.match(validacoes, /Nunca oferecer ou mencionar espontaneamente/i);
});

test('pet fica exclusivamente no ambiente externo', () => {
    assert.match(pets, /permitidos somente no ambiente externo/i);
    assert.match(pets, /não deve oferecer Sala VIP/i);
    assert.match(reservas, /Com pet, a Ana nunca deve oferecer ambiente interno ou Sala VIP/i);
});

test('mantém um único cabeçalho de uso de senhor e senhora', () => {
    const ocorrencias = regras.match(/^USO DE SENHOR E SENHORA$/gim) || [];
    assert.equal(ocorrencias.length, 1);
});
