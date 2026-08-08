const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cardapioPath = path.join(
    __dirname,
    '..',
    '..',
    'ChatBot',
    'ana',
    'Prompts',
    'Negocio',
    'Cardapio.txt'
);

const chatbotPath = path.join(
    __dirname,
    '..',
    '..',
    'ChatBot',
    'chatbot.js'
);

test('cardápio cadastra as três especialidades como prato para duas pessoas', () => {
    const cardapio = fs.readFileSync(cardapioPath, 'utf8');

    assert.match(
        cardapio,
        /As três especialidades abaixo servem duas pessoas/i
    );
    assert.match(
        cardapio,
        /Raclette du Valais:[\s\S]*Serve duas pessoas\.[\s\S]*R\$ 209,00 pelo prato completo para duas pessoas, não por pessoa/i
    );
    assert.match(
        cardapio,
        /Fondue chinoise de mignon:[\s\S]*Serve duas pessoas\.[\s\S]*R\$ 239,00 pelo prato completo para duas pessoas, não por pessoa/i
    );
    assert.match(
        cardapio,
        /Fondue de Queijo:[\s\S]*Serve duas pessoas\.[\s\S]*R\$ 209,00 pelo prato completo para duas pessoas, não por pessoa/i
    );
});

test('preço das especialidades é respondido antes da chamada à IA', () => {
    const chatbot = fs.readFileSync(chatbotPath, 'utf8');
    const indiceRespostaDeterministica = chatbot.indexOf(
        'const respostaEspecialidadeInverno ='
    );
    const indiceOpenAI = chatbot.indexOf(
        'const respostaOriginalAna = await falarComAna('
    );

    assert.ok(indiceRespostaDeterministica >= 0);
    assert.ok(indiceOpenAI > indiceRespostaDeterministica);
    assert.match(
        chatbot,
        /criarRespostaPrecoEspecialidadesInverno\(message\.body\)/
    );
});

