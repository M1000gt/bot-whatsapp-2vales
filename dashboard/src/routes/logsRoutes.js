const express = require('express');

const layout = require('../views/layout');
const escapeHtml = require('../utils/escapeHtml');
const { carregarClientes, encontrarCliente } = require('../services/clientesService');
const { getPm2Logs } = require('../services/pm2Service');
const { lerLogPorMes } = require('../services/logService');

const router = express.Router();

function montarOpcoesMeses(meses, mesSelecionado) {
    if (!meses.length) {
        return `<option value="">Sem arquivos mensais</option>`;
    }

    return meses.map(mes => {
        const selected = mes === mesSelecionado ? 'selected' : '';
        return `<option value="${escapeHtml(mes)}" ${selected}>${escapeHtml(mes)}</option>`;
    }).join('');
}

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

    const mes = typeof req.query.mes === 'string' ? req.query.mes : '';

    const resultado = lerLogPorMes({
        logFile: bot.conversationLog,
        tipo: 'conversas',
        mes,
        fallback: 'Nenhuma conversa registrada para este período.'
    });

    const opcoesMeses = montarOpcoesMeses(resultado.meses, resultado.mesSelecionado);

    const downloadButton = resultado.filePath
        ? `<a class="button-link primary" href="/conversas/${encodeURIComponent(bot.pm2)}/download?mes=${encodeURIComponent(resultado.mesSelecionado === 'legado' ? '' : resultado.mesSelecionado)}">Baixar log</a>`
        : '';

    const origemLabel = resultado.origem === 'mensal'
        ? `Arquivo mensal: ${resultado.mesSelecionado}`
        : resultado.origem === 'legado'
            ? 'Arquivo legado: conversas.log'
            : 'Sem arquivo encontrado';

    const content = `
        <div class="card">
            <div class="card-header">
                <div>
                    <h2>Conversas recentes</h2>
                    <small>${escapeHtml(bot.nome)} • <code>${escapeHtml(bot.pm2)}</code></small>
                    <small>${escapeHtml(origemLabel)}</small>
                </div>
                <a class="button-link secondary" href="/logs">Voltar</a>
            </div>

            <form method="GET" action="/conversas/${encodeURIComponent(bot.pm2)}" style="margin-bottom: 18px;">
                <div class="info">
                    <div class="info-item">
                        <span>Selecionar mês</span>
                        <select name="mes" onchange="this.form.submit()" style="width:100%; margin-top:8px; padding:12px; border-radius:12px; border:1px solid rgba(148,163,184,0.24); background:#020617; color:#f8fafc;">
                            ${opcoesMeses}
                        </select>
                    </div>

                    <div class="info-item">
                        <span>Ações</span>
                        <div class="actions" style="margin-top:8px;">
                            ${downloadButton}
                            <a class="button-link secondary" href="/conversas/${encodeURIComponent(bot.pm2)}">Mês mais recente</a>
                        </div>
                    </div>
                </div>
            </form>

            <pre>${escapeHtml(resultado.conteudo)}</pre>
        </div>
    `;

    res.send(layout(content, 'logs'));
});

router.get('/conversas/:pm2/download', (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    const mes = typeof req.query.mes === 'string' ? req.query.mes : '';

    const resultado = lerLogPorMes({
        logFile: bot.conversationLog,
        tipo: 'conversas',
        mes,
        fallback: ''
    });

    if (!resultado.filePath) {
        return res.status(404).send('Log não encontrado.');
    }

    const nomeArquivo = resultado.mesSelecionado === 'legado'
        ? `conversas-${bot.pm2}-legado.log`
        : `conversas-${bot.pm2}-${resultado.mesSelecionado}.log`;

    res.download(resultado.filePath, nomeArquivo);
});

module.exports = router;
