const { criarBlocoContatoAviso } = require('./contatoWhatsApp');

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
    const blocoContato = criarBlocoContatoAviso({
        nome: nomeContato,
        telefone: contato?.telefone,
        idTecnico: contato?.idTecnico
    }, 'Cliente no WhatsApp');

    return `🛵 NOVO PEDIDO DELIVERY — 2VALES

${blocoContato}

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
    criarAvisoPedidoDelivery
};
