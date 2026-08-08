const { obterHoraBrasil } = require('../../core/utils/dataHoraBrasil');

function saudacao(data = new Date()) {
    const hora = obterHoraBrasil(data);

    if (hora < 12)
        return 'Olá, bom dia! ☀️';

    if (hora < 18)
        return 'Olá, boa tarde! 🌤️';

    return 'Olá, boa noite! 🌙';
}

module.exports = saudacao;
