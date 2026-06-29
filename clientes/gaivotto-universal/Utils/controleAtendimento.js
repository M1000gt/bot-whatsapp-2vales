const path = require('path');
const { criarControleAtendimento } = require('../../../core/utils/controleAtendimento');

module.exports = criarControleAtendimento(
    path.join(__dirname, '..', 'control.json')
);
