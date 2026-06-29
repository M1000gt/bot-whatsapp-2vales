const path = require('path');
const { criarLogMensal } = require('../../../core/utils/logMensal');

module.exports = criarLogMensal({
    baseLogsDir: path.join(__dirname, '..', 'logs')
});
