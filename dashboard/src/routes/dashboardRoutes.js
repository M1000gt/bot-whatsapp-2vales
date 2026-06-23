const express = require('express');

const layout = require('../views/layout');
const escapeHtml = require('../utils/escapeHtml');
const { carregarClientes } = require('../services/clientesService');
const { carregarControle } = require('../services/controleService');
const { getBotStatus } = require('../services/pm2Service');

const router = express.Router();

router.get('/', async (req, res) => {
    const clientes = carregarClientes();

    let onlineCount = 0;
    let cards = '';
    let alertasSistema = '';

    for (const bot of clientes) {
        const data = await getBotStatus(bot.pm2);
        const controle = carregarControle(bot);

        const autoReply = controle.autoReply !== false;
        const autoReplyLabel = autoReply ? 'Ativo' : 'Pausado';
        const autoReplyClass = autoReply ? 'online' : 'warning';
        const autoReplyButton = autoReply ? 'Pausar respostas' : 'Reativar respostas';
        const autoReplyButtonClass = autoReply ? 'ghost' : 'primary';

        const isOnline = data.status === 'online';
        if (isOnline) onlineCount++;

        const deveMonitorar = bot.monitorar !== false;

        const problemaDetectado =
            deveMonitorar &&
            data.status !== 'online' &&
            data.status !== 'conectado' &&
            data.status !== 'autenticado';

        if (problemaDetectado) {
            alertasSistema += `
                <div class="system-alert">
                    <strong>🚨 Atenção: possível problema detectado</strong>
                    <span>
                        ${escapeHtml(bot.nome)} está com status <code>${escapeHtml(data.status)}</code>.
                        Verifique logs, QR Code ou reinicie o bot se necessário.
                    </span>
                </div>
            `;
        }

        let statusClass = 'warning';

        if (data.status === 'online') statusClass = 'online';
        if (data.status === 'stopped' || data.status === 'erro ao ler') statusClass = 'offline';

        cards += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h2>${escapeHtml(bot.nome)}</h2>
                        <small>${escapeHtml(bot.subtitulo || '')}</small>
                    </div>

                    <span class="status-pill ${statusClass}">
                        ${escapeHtml(data.status)}
                    </span>
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

                    <div class="info-item">
                        <span>Atendimento automático</span>
                        <strong><span class="status-pill ${autoReplyClass}">${autoReplyLabel}</span></strong>
                    </div>

                    <div class="info-item">
                        <span>Uptime</span>
                        <strong>${escapeHtml(data.uptime)}</strong>
                    </div>

                    <div class="info-item">
                        <span>Reinícios</span>
                        <strong>${escapeHtml(data.restarts)}</strong>
                    </div>

                    <div class="info-item">
                        <span>Memória</span>
                        <strong>${escapeHtml(data.memory)}</strong>
                    </div>

                    <div class="info-item">
                        <span>CPU</span>
                        <strong>${escapeHtml(data.cpu)}</strong>
                    </div>
                </div>

                <div class="actions">
                    <form method="POST" action="/restart/${encodeURIComponent(bot.pm2)}" onsubmit="return confirm('Reiniciar o bot ${escapeHtml(bot.nome)}?');">
                        <button class="primary" type="submit">Reiniciar bot</button>
                    </form>

                    <form method="POST" action="/toggle-auto-reply/${encodeURIComponent(bot.pm2)}" onsubmit="return confirm('Alterar atendimento automático deste bot?');">
                        <button class="${autoReplyButtonClass}" type="submit">${autoReplyButton}</button>
                    </form>

                    <a class="button-link secondary" href="/logs/${encodeURIComponent(bot.pm2)}">Ver logs técnicos</a>

                    <a class="button-link secondary" href="/conversas/${encodeURIComponent(bot.pm2)}">Ver conversas</a>

                    ${bot.leadsLog ? `<a class="button-link secondary" href="/leads/${encodeURIComponent(bot.pm2)}">Ver leads</a>` : ``}

                    <a class="button-link danger" href="/qrcode/${encodeURIComponent(bot.pm2)}">Ver QR Code</a>
                </div>
            </div>
        `;
    }

    if (!clientes.length) {
        cards = `
            <div class="card">
                <h2>Nenhum cliente cadastrado</h2>
                <small>Adicione clientes no arquivo <code>clientes.json</code>.</small>
            </div>
        `;
    }

    const content = `
        ${alertasSistema}

        <section class="stats">
            <div class="stat">
                <span>Clientes cadastrados</span>
                <strong>${clientes.length}</strong>
            </div>

            <div class="stat">
                <span>Bots online</span>
                <strong>${onlineCount}</strong>
            </div>

            <div class="stat">
                <span>Arquitetura</span>
                <strong>JSON</strong>
            </div>
        </section>

        <section class="grid">
            ${cards}
        </section>
    `;

    res.send(layout(content, 'dashboard'));
});

module.exports = router;
