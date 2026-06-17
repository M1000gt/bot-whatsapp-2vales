const qrcode =
require('qrcode-terminal');
const {
    Client,
    LocalAuth,
    MessageMedia
} = require('whatsapp-web.js');
const enviar =
require('./Utils/enviar');

const menu =
require('./Mensagens/menu');

const horarios =
require('./Mensagens/horarios');

const localizacao =
require('./Mensagens/localizacao');

const reservaModelo =
require('./Mensagens/reservaModelo');

const {
    grupoReservas,
    caminhoCardapio
} = require('./config/config');
const{
    falarComAna
} = require('./ana/Ana')
console.log("TESTE");