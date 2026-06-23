const express = require('express');

const { encontrarCliente } = require('../services/clientesService');
const { carregarControle, salvarControle } = require('../services/controleService');
const { restartBot } = require('../services/pm2Service');

const router = express.Router();

router.post('/restart/:pm2', async (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    await restartBot(bot.pm2);
    res.redirect('/');
});

router.post('/toggle-auto-reply/:pm2', (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    const controle = carregarControle(bot);
    const autoReplyAtual = controle.autoReply !== false;

    controle.autoReply = !autoReplyAtual;
    controle.updatedAt = new Date().toISOString();

    salvarControle(bot, controle);

    res.redirect('/');
});

module.exports = router;
