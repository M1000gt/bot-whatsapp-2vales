const express = require('express');
const fs = require('fs');

const layout = require('../views/layout');
const escapeHtml = require('../utils/escapeHtml');
const { carregarClientes, encontrarCliente } = require('../services/clientesService');

const router = express.Router();

router.get('/leads', async (req, res) => {
    const clientes = carregarClientes();
    const clientesComLeads = clientes.filter(bot => bot.leadsLog);

    let cards = '';

    for (const bot of clientesComLeads) {
        let totalLeads = 0;
        let ultimoLead = 'Nenhum lead registrado ainda.';

        if (bot.leadsLog && fs.existsSync(bot.leadsLog)) {
            const conteudo = fs.readFileSync(bot.leadsLog, 'utf8');
            totalLeads = (conteudo.match(/🔥 LEAD INTERESSADO/g) || []).length;

            const partes = conteudo.split('🔥 LEAD INTERESSADO').filter(Boolean);
            if (partes.length) {
                ultimoLead = '🔥 LEAD INTERESSADO' + partes[partes.length - 1];
            }
        }

        cards += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h2>${escapeHtml(bot.nome)}</h2>
                        <small>Leads captados • <code>${escapeHtml(bot.pm2)}</code></small>
                    </div>

                    <span class="status-pill ${totalLeads > 0 ? 'online' : 'warning'}">
                        ${totalLeads} lead${totalLeads === 1 ? '' : 's'}
                    </span>
                </div>

                <pre>${escapeHtml(ultimoLead)}</pre>

                <div class="actions">
                    <a class="button-link primary" href="/leads/${encodeURIComponent(bot.pm2)}">Abrir leads</a>
                    <a class="button-link secondary" href="/">Voltar</a>
                </div>
            </div>
        `;
    }

    if (!cards) {
        cards = `
            <div class="card">
                <h2>Nenhum funil de leads configurado</h2>
                <small>Adicione <code>leadsLog</code> no cliente desejado dentro do <code>clientes.json</code>.</small>
            </div>
        `;
    }

    const content = `
        <section class="grid">
            ${cards}
        </section>
    `;

    res.send(layout(content, 'leads'));
});

router.get('/leads/:pm2', async (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    let leads = 'Nenhum lead registrado ainda.';

    if (bot.leadsLog && fs.existsSync(bot.leadsLog)) {
        leads = fs.readFileSync(bot.leadsLog, 'utf8') || leads;
    }

    const content = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h2>Leads recentes</h2>
                    <small>${escapeHtml(bot.nome)} • <code>${escapeHtml(bot.pm2)}</code></small>
                </div>
                <a class="button-link secondary" href="/leads">Voltar</a>
            </div>

            <pre>${escapeHtml(leads)}</pre>
        </div>
    `;

    res.send(layout(content, 'leads'));
});

module.exports = router;
