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

function campoOuFallback(valor, fallback = 'Não identificado automaticamente — confira a mensagem original.') {
    const texto = String(valor || '').trim();
    return texto || fallback;
}

function criarAvisoPedidoDelivery({
    nomeContato,
    contato,
    dadosPedido,
    textoCliente,
    respostaAna
}) {
    const dados = dadosPedido || {};
    const idFallback = contato?.idTecnico
        ? `\n\n🔎 ID técnico:\n${contato.idTecnico}`
        : '';

    return `🛵 NOVO PEDIDO DELIVERY — 2VALES

👤 Cliente no WhatsApp:
${campoOuFallback(nomeContato)}

📱 Telefone:
${campoOuFallback(contato?.telefone)}${idFallback}

━━━━━━━━━━━━━━━

🧾 DADOS INTERPRETADOS DO PEDIDO

Nome informado:
${campoOuFallback(dados.nome)}

📍 Localidade/endereço:
${campoOuFallback(dados.localidade)}

🍽️ Pedido:
${campoOuFallback(dados.pedido)}

🥔 Acompanhamento:
${campoOuFallback(dados.acompanhamento)}

🔢 Quantidade:
${campoOuFallback(dados.quantidade, 'Não informada — confira a mensagem original.')}

📝 Observações:
${campoOuFallback(dados.observacoes, 'Nenhuma observação adicional identificada.')}

━━━━━━━━━━━━━━━

💬 Mensagem original:
${textoCliente}

━━━━━━━━━━━━━━━

🤖 Resumo da Ana:
${respostaAna}

━━━━━━━━━━━━━━━

⚠️ A equipe deve confirmar:
- disponibilidade do prato;
- taxa de entrega;
- tempo de entrega;
- localidade/área;
- forma de pagamento;
- fechamento do pedido.`;
}

module.exports = {
    criarAvisoPedidoDelivery,
    formatarTelefone,
    resolverContatoExibicao
};
