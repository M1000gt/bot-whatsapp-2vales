const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..', '..');

test('package aponta para o chatbot ativo que existe no projeto', () => {
    const pacote = JSON.parse(
        fs.readFileSync(path.join(raiz, 'package.json'), 'utf8')
    );

    assert.equal(pacote.main, 'ChatBot/chatbot.js');
    assert.equal(fs.existsSync(path.join(raiz, pacote.main)), true);
});

test('prompt universal permanece documentado e isolado do 2Vales', () => {
    const ana = fs.readFileSync(
        path.join(raiz, 'ChatBot', 'ana', 'Ana.js'),
        'utf8'
    );
    const documentacao = fs.readFileSync(
        path.join(raiz, 'core', 'prompts', 'README.md'),
        'utf8'
    );

    assert.doesNotMatch(ana, /EstiloAnaUniversal\.txt/);
    assert.match(documentacao, /não é carregado.*de forma intencional/is);
});
