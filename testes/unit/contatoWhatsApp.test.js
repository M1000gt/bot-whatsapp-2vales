const test = require('node:test');
const assert = require('node:assert/strict');

const {
    criarBlocoContatoAviso,
    formatarTelefone,
    obterContatoParaAviso,
    resolverContatoExibicao
} = require('../../core/utils/contatoWhatsApp');

test('formata números brasileiros recebidos como c.us', () => {
    assert.equal(formatarTelefone('5524999999999@c.us'), '+55 (24) 99999-9999');
    assert.equal(formatarTelefone('552422222222@c.us'), '+55 (24) 2222-2222');
});

test('converte LID em telefone quando o WhatsApp disponibiliza a relação', async () => {
    const client = {
        getContactLidAndPhone: async () => [{
            lid: '227062824616174@lid',
            pn: '5524999999999@c.us'
        }],
        getFormattedNumber: async () => '+55 24 99999-9999'
    };
    const contato = await resolverContatoExibicao(
        client,
        '227062824616174@lid'
    );

    assert.equal(contato.telefone, '+55 24 99999-9999');
    assert.equal(contato.idTecnico, null);
});

test('mantém o LID apenas como fallback quando o telefone não está disponível', async () => {
    const client = {
        getContactLidAndPhone: async () => []
    };
    const contato = await resolverContatoExibicao(
        client,
        '227062824616174@lid'
    );

    assert.equal(contato.telefone, 'Não disponibilizado pelo WhatsApp');
    assert.equal(contato.idTecnico, '227062824616174@lid');
});

test('obtém nome e telefone em uma única identificação reutilizável', async () => {
    const client = {
        getContactLidAndPhone: async () => [{
            lid: '227062824616174@lid',
            pn: '5524999999999@c.us'
        }],
        getFormattedNumber: async () => '+55 24 99999-9999'
    };
    const message = {
        from: '227062824616174@lid',
        getContact: async () => ({ pushname: 'Gustavo' })
    };
    const contato = await obterContatoParaAviso(client, message);

    assert.deepEqual(contato, {
        nome: 'Gustavo',
        telefone: '+55 24 99999-9999',
        idTecnico: null
    });
});

test('bloco geral mostra telefone ou LID técnico sem confundir os dois', () => {
    const comTelefone = criarBlocoContatoAviso({
        nome: 'Gustavo',
        telefone: '+55 24 99999-9999',
        idTecnico: null
    });
    const semTelefone = criarBlocoContatoAviso({
        nome: 'Gustavo',
        telefone: 'Não disponibilizado pelo WhatsApp',
        idTecnico: '227062824616174@lid'
    });

    assert.match(comTelefone, /Cliente:\nGustavo/);
    assert.match(comTelefone, /Telefone:\n\+55 24 99999-9999/);
    assert.doesNotMatch(comTelefone, /ID técnico/);
    assert.match(semTelefone, /Telefone:\nNão disponibilizado/);
    assert.match(semTelefone, /ID técnico:\n227062824616174@lid/);
});
