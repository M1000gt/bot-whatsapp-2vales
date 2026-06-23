const express = require('express');

const layout = require('../views/layout');
const escapeHtml = require('../utils/escapeHtml');
const { carregarClientes } = require('../services/clientesService');
const { getBotStatus } = require('../services/pm2Service');

const router = express.Router();

router.get('/clientes', async (req, res) => {
    const clientes = carregarClientes();

    let cards = '';

    for (const bot of clientes) {
        const data = await getBotStatus(bot.pm2);

        cards += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h2>${escapeHtml(bot.nome)}</h2>
                        <small>${escapeHtml(bot.subtitulo || '')}</small>
                    </div>
                    <span class="status-pill ${data.status === 'online' ? 'online' : 'warning'}">${escapeHtml(data.status)}</span>
                </div>

                <div class="info">
                    <div class="info-item">
                        <span>PM2</span>
                        <strong><code>${escapeHtml(bot.pm2)}</code></strong>
                    </div>
                    <div class="info-item">
                        <span>Tipo</span>
                        <strong>${escapeHtml(bot.tipo || '-')}</strong>
                    </div>
                </div>

                <div class="actions">
                    <a class="button-link secondary" href="/qrcode/${encodeURIComponent(bot.pm2)}">QR Code</a>
                    <a class="button-link secondary" href="/logs/${encodeURIComponent(bot.pm2)}">Logs</a>
                    <a class="button-link secondary" href="/conversas/${encodeURIComponent(bot.pm2)}">Conversas</a>
                    ${bot.leadsLog ? `<a class="button-link secondary" href="/leads/${encodeURIComponent(bot.pm2)}">Leads</a>` : ``}
                </div>
            </div>
        `;
    }

    const content = `
        <section class="grid">
            ${cards}
        </section>
    `;

    res.send(layout(content, 'clientes'));
});

module.exports = router;
