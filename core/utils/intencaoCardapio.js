function normalizar(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[!?.,;:]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function mensagemAutorizaEnvioCardapio(texto = '') {
    const mensagem = normalizar(texto);

    if (!mensagem) return false;

    const afirmacaoCurta = /^(sim|sim por favor|sim pode enviar|sim pode mandar|pode|pode sim|pode enviar|pode mandar|quero|eu quero|manda|manda sim|envia|envia sim|por favor)$/i;

    if (afirmacaoCurta.test(mensagem)) {
        return true;
    }

    const perguntaPontualPreco = /\b(quanto custa|qual (?:e )?o valor|preco de|valor de)\b/i.test(mensagem);
    const pedeArquivoOuMenu = /\b(cardapio|menu|pdf)\b/i.test(mensagem);

    if (perguntaPontualPreco && !pedeArquivoOuMenu) {
        return false;
    }

    const pedidoExplicito = /\b(me envia|me envie|me enviar|me manda|me mande|me mandar|mandar|enviar|receber|quero ver|gostaria de ver|posso ver|pode mostrar|consultar|abrir|baixar)\b/i;
    const visaoGeralPratos = /\b(quais pratos|opcoes de pratos|opcoes para comer|o que (?:voces )?tem para comer)\b/i;

    return (
        pedeArquivoOuMenu && pedidoExplicito.test(mensagem)
    ) || visaoGeralPratos.test(mensagem);
}

module.exports = {
    mensagemAutorizaEnvioCardapio
};
