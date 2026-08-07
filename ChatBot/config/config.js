const path = require('path');

module.exports = {
    grupoReservas: process.env.GRUPO_RESERVAS_ID ||
        '120363407529784204@g.us',

    caminhoCardapio: process.env.CARDAPIO_PATH ||
        path.join(__dirname, '..', 'Arquivos', 'Cardapio leve.pdf')

};
