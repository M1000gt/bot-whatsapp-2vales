const express = require('express');
const fs = require('fs');

const layout = require('../views/layout');
const escapeHtml = require('../utils/escapeHtml');
const { carregarClientes, encontrarCliente } = require('../services/clientesService');

const router = express.Router();

router.get('/qr', async (req, res) => {
    const clientes = carregarClientes();

    let cards = '';

    for (const bot of clientes) {
        cards += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h2>${escapeHtml(bot.nome)}</h2>
                        <small>QR Code • <code>${escapeHtml(bot.pm2)}</code></small>
                    </div>
                </div>

                <p style="color:#94a3b8;">
                    Abra a tela de QR Code deste cliente para conectar ou verificar a sessão do WhatsApp.
                </p>

                <div class="actions">
                    <a class="button-link primary" href="/qrcode/${encodeURIComponent(bot.pm2)}">Abrir QR Code</a>
                </div>
            </div>
        `;
    }

    const content = `
        <section class="grid">
            ${cards}
        </section>
    `;

    res.send(layout(content, 'qr'));
});

router.get('/qrcode/:pm2', async (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    let status = 'sem_informacao';
    let updatedAt = '-';
    let motivo = '';

    if (bot.qrStatus && fs.existsSync(bot.qrStatus)) {
        try {
            const data = JSON.parse(fs.readFileSync(bot.qrStatus, 'utf8'));
            status = data.status || status;
            updatedAt = data.updatedAt || updatedAt;
            motivo = data.motivo || '';
        } catch {
            status = 'erro_ao_ler_status';
        }
    }

    const hasQr = bot.qrImage && fs.existsSync(bot.qrImage);

    let qrBlock = '';

    if (hasQr) {
        qrBlock = `
            <div style="margin-top: 22px; background: white; padding: 18px; border-radius: 18px; display: inline-block;">
                <img src="/qrcode-image/${encodeURIComponent(bot.pm2)}?t=${Date.now()}" style="width: 320px; max-width: 100%; display: block;">
            </div>

            <p style="color:#cbd5e1; margin-top:16px;">
                Escaneie esse QR Code pelo WhatsApp do cliente.
            </p>
        `;
    } else {
        const qrTitulo = (status === 'conectado' || status === 'autenticado')
            ? 'WhatsApp conectado'
            : 'QR Code ainda não gerado';

        const qrTexto = (status === 'conectado' || status === 'autenticado')
            ? 'Nenhum QR Code necessário no momento.<br><br>Para gerar um novo QR Code, a sessão precisa ser removida manualmente por segurança. O painel não desconecta clientes automaticamente.'
            : 'Esse cliente ainda não possui QR Code ativo. Quando o bot for iniciado sem uma sessão conectada, o QR Code aparecerá aqui automaticamente.';

        qrBlock = `
            <div class="info-item" style="margin-top: 18px;">
                <span>Status do QR Code</span>
                <strong>${qrTitulo}</strong>
            </div>

            <p style="color:#94a3b8; margin-top:16px;">
                ${qrTexto}
            </p>
        `;
    }

    const content = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h2>QR Code</h2>
                    <small>${escapeHtml(bot.nome)} • <code>${escapeHtml(bot.pm2)}</code></small>
                </div>
                <a class="button-link secondary" href="/">Voltar</a>
            </div>

            <div class="info">
                <div class="info-item">
                    <span>Status</span>
                    <strong>${escapeHtml(status)}</strong>
                </div>

                <div class="info-item">
                    <span>Atualizado em</span>
                    <strong>${escapeHtml(updatedAt)}</strong>
                </div>
            </div>

            ${motivo ? `<p style="color:#fca5a5;">Motivo: ${escapeHtml(motivo)}</p>` : ''}

            ${qrBlock}
        </div>
    `;

    res.send(layout(content, 'qr'));
});

router.get('/qrcode-image/:pm2', (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot || !bot.qrImage || !fs.existsSync(bot.qrImage)) {
        return res.status(404).send('QR Code não encontrado.');
    }

    res.sendFile(bot.qrImage);
});

module.exports = router;
