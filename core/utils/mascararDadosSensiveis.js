function mascararDadosSensiveis(texto = '') {
    return String(texto)
        .replace(/sk-(?:proj-)?[A-Za-z0-9_-]{16,}/g, '[CHAVE DE API OCULTA]')
        .replace(/senha\s*[:=]\s*\S+/gi, 'senha: [OCULTA]')
        .replace(/[\w.-]+\.pfx/gi, '[ARQUIVO PFX OCULTO]')
        .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[E-MAIL OCULTO]')
        .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF OCULTO]')
        .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[CNPJ OCULTO]')
        .replace(/\b\d{8,}(?:@c\.us|@lid)\b/g, '[CONTATO WHATSAPP OCULTO]')
        .replace(/(?:\+?55\s*)?(?:\(?\d{2}\)?[\s.-]*)?(?:9\d{4}|\d{4})[\s.-]*\d{4}\b/g, '[TELEFONE OCULTO]');
}

module.exports = {
    mascararDadosSensiveis
};
