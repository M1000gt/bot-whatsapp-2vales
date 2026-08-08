function extrairDigitosTelefone(valor = '') {
    const texto = String(valor || '');
    if (texto.includes('@') && !texto.endsWith('@c.us')) return '';
    return texto.replace('@c.us', '').replace(/\D/g, '');
}

function formatarTelefone(numero = '') {
    const digitos = extrairDigitosTelefone(numero);

    if (/^55\d{11}$/.test(digitos)) {
        return `+55 (${digitos.slice(2, 4)}) ${digitos.slice(4, 9)}-${digitos.slice(9)}`;
    }

    if (/^55\d{10}$/.test(digitos)) {
        return `+55 (${digitos.slice(2, 4)}) ${digitos.slice(4, 8)}-${digitos.slice(8)}`;
    }

    return digitos ? `+${digitos}` : '';
}

async function resolverContatoExibicao(client, chatId = '') {
    let pn = String(chatId || '').endsWith('@c.us') ? String(chatId) : '';

    if (!pn && String(chatId).endsWith('@lid') && typeof client?.getContactLidAndPhone === 'function') {
        try {
            const vinculos = await client.getContactLidAndPhone([chatId]);
            const vinculo = Array.isArray(vinculos)
                ? vinculos.find(item => item?.lid === chatId) || vinculos[0]
                : null;

            if (vinculo?.pn?.endsWith('@c.us')) pn = vinculo.pn;
        } catch (_) {}
    }

    if (pn) {
        try {
            if (typeof client?.getFormattedNumber === 'function') {
                const telefoneFormatado = await client.getFormattedNumber(pn);
                if (telefoneFormatado && !String(telefoneFormatado).includes('@')) {
                    return {
                        telefone: String(telefoneFormatado),
                        idTecnico: null
                    };
                }
            }
        } catch (_) {}

        return {
            telefone: formatarTelefone(pn),
            idTecnico: null
        };
    }

    return {
        telefone: 'Não disponibilizado pelo WhatsApp',
        idTecnico: String(chatId || 'Não disponível')
    };
}

async function obterContatoParaAviso(client, message) {
    let nome = message?._data?.notifyName || 'Não informado';

    try {
        const contato = await message.getContact();
        nome = contato.pushname || contato.name || contato.shortName || nome;
    } catch (_) {}

    const contatoExibicao = await resolverContatoExibicao(
        client,
        message?.from || ''
    );

    return {
        nome,
        telefone: contatoExibicao.telefone,
        idTecnico: contatoExibicao.idTecnico
    };
}

function criarBlocoContatoAviso(contato = {}, rotuloNome = 'Cliente') {
    const nome = String(contato.nome || 'Não informado').trim();
    const telefone = String(
        contato.telefone || 'Não disponibilizado pelo WhatsApp'
    ).trim();
    const blocoId = contato.idTecnico
        ? `\n\n🔎 ID técnico:\n${contato.idTecnico}`
        : '';

    return `👤 ${rotuloNome}:
${nome}

📱 Telefone:
${telefone}${blocoId}`;
}

module.exports = {
    criarBlocoContatoAviso,
    formatarTelefone,
    obterContatoParaAviso,
    resolverContatoExibicao
};
