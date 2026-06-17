function saudacao() {

    const hora = new Date().getHours();

    if (hora < 12)
        return 'Olá, bom dia! ☀️';

    if (hora < 18)
        return 'Olá, boa tarde! 🌤️';

    return 'Olá, boa noite! 🌙';
}

module.exports = saudacao;