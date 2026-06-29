const path = require('path');
const { criarHandoffHumano } = require('../../../core/utils/handoffHumano');

module.exports = criarHandoffHumano({
    handoffPath: path.join(__dirname, '..', 'handoff-humano.json'),
    minutosPadrao: 30
});
