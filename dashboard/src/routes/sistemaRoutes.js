const express = require('express');

const layout = require('../views/layout');
const escapeHtml = require('../utils/escapeHtml');
const { carregarClientes } = require('../services/clientesService');
const { getBotStatus } = require('../services/pm2Service');

const router = express.Router();

router.get('/status', async (req, res) => {
    const clientes = carregarClientes();

    let itens = '';

    for (const bot of clientes) {
        const data = await getBotStatus(bot.pm2);

        itens += `
            <div class="info-item">
                <span>${escapeHtml(bot.nome)}</span>
                <strong>${escapeHtml(data.status)} • ${escapeHtml(data.uptime)}</strong>
            </div>
        `;
    }

    const content = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h2>Status geral</h2>
                    <small>Resumo rápido dos bots cadastrados.</small>
                </div>
                <a class="button-link secondary" href="/">Voltar</a>
            </div>

            <div class="info">
                ${itens}
            </div>
        </div>
    `;

    res.send(layout(content, 'status'));
});

router.get('/config', (req, res) => {
    const content = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h2>Configurações</h2>
                    <small>Área reservada para ajustes futuros do painel.</small>
                </div>
                <a class="button-link secondary" href="/">Voltar</a>
            </div>

            <p style="color:#94a3b8;">
                Essa página ainda está em construção. Por enquanto, as configurações principais ficam no arquivo <code>clientes.json</code> e nos arquivos de controle de cada bot.
            </p>
        </div>
    `;

    res.send(layout(content, 'config'));
});

module.exports = router;
