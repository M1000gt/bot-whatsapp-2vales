const express = require('express');
const fs = require('fs');

const layout = require('../views/layout');
const escapeHtml = require('../utils/escapeHtml');
const { carregarClientes, encontrarCliente } = require('../services/clientesService');
const { getPm2Logs } = require('../services/pm2Service');

const router = express.Router();

router.get('/logs', async (req, res) => {
    const clientes = carregarClientes();

    let cards = '';

    for (const bot of clientes) {
        cards += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h2>${escapeHtml(bot.nome)}</h2>
                        <small>Logs técnicos • <code>${escapeHtml(bot.pm2)}</code></small>
                    </div>
                </div>

                <div class="actions">
                    <a class="button-link secondary" href="/logs/${encodeURIComponent(bot.pm2)}">Ver logs técnicos</a>
                    <a class="button-link secondary" href="/conversas/${encodeURIComponent(bot.pm2)}">Ver conversas</a>
                </div>
            </div>
        `;
    }

    const content = `
        <section class="grid">
            ${cards}
        </section>
    `;

    res.send(layout(content, 'logs'));
});

router.get('/logs/:pm2', async (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    const logs = await getPm2Logs(bot.pm2, 100);

    const content = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h2>Logs recentes</h2>
                    <small>${escapeHtml(bot.nome)} • <code>${escapeHtml(bot.pm2)}</code></small>
                </div>
                <a class="button-link secondary" href="/">Voltar</a>
            </div>

            <pre>${escapeHtml(logs)}</pre>
        </div>
    `;

    res.send(layout(content, 'logs'));
});

router.get('/conversas/:pm2', async (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    let conversas = 'Nenhuma conversa registrada ainda.';

    if (bot.conversationLog && fs.existsSync(bot.conversationLog)) {
        conversas = fs.readFileSync(bot.conversationLog, 'utf8') || conversas;
    }

    const content = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h2>Conversas recentes</h2>
                    <small>${escapeHtml(bot.nome)} • <code>${escapeHtml(bot.pm2)}</code></small>
                </div>
                <a class="button-link secondary" href="/">Voltar</a>
            </div>

            <pre>${escapeHtml(conversas)}</pre>
        </div>
    `;

    res.send(layout(content, 'logs'));
});

module.exports = router;
