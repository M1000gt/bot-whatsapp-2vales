const express = require('express');
const basicAuth = require('express-basic-auth');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;
const DASH_USER = process.env.DASH_USER || 'gustavo';
const DASH_PASS = process.env.DASH_PASS || 'troque-essa-senha';

const CLIENTES_PATH = path.join(__dirname, 'clientes.json');

app.use(basicAuth({
    users: { [DASH_USER]: DASH_PASS },
    challenge: true
}));

function carregarClientes() {
    try {
        if (!fs.existsSync(CLIENTES_PATH)) {
            return [];
        }

        const raw = fs.readFileSync(CLIENTES_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        console.error('Erro ao carregar clientes.json:', error.message);
        return [];
    }
}

function run(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
            resolve(stdout || stderr || err?.message || '');
        });
    });
}

function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

async function getBotStatus(pm2Name) {
    const statusRaw = await run('pm2 jlist');

    try {
        const list = JSON.parse(statusRaw);
        const bot = list.find(b => b.name === pm2Name);

        if (!bot) {
            return {
                status: 'não encontrado',
                uptime: '-',
                restarts: '-',
                memory: '-',
                cpu: '-'
            };
        }

        const memoryMb = bot.monit && bot.monit.memory
            ? `${Math.round(bot.monit.memory / 1024 / 1024)} MB`
            : '-';

        const cpu = bot.monit && bot.monit.cpu !== undefined
            ? `${bot.monit.cpu}%`
            : '-';

        const uptimeMs = Date.now() - bot.pm2_env.pm_uptime;
        const uptimeMin = Math.max(1, Math.floor(uptimeMs / 1000 / 60));

        let uptimeText = `${uptimeMin} min`;

        if (uptimeMin >= 60) {
            const horas = Math.floor(uptimeMin / 60);
            const minutos = uptimeMin % 60;
            uptimeText = `${horas}h ${minutos}min`;
        }

        return {
            status: bot.pm2_env.status,
            uptime: uptimeText,
            restarts: bot.pm2_env.restart_time,
            memory: memoryMb,
            cpu
        };
    } catch {
        return {
            status: 'erro ao ler',
            uptime: '-',
            restarts: '-',
            memory: '-',
            cpu: '-'
        };
    }
}

function encontrarCliente(pm2Name) {
    const clientes = carregarClientes();
    return clientes.find(item => item.pm2 === pm2Name);
}

function layout(content, currentPage = 'dashboard') {
    const active = (page) => currentPage === page ? 'active' : '';

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>M1000gt Control</title>

            <style>
                :root {
                    --bg-main: #080f1f;
                    --bg-panel: rgba(15, 23, 42, 0.82);
                    --bg-card: rgba(30, 41, 59, 0.78);
                    --bg-soft: rgba(15, 23, 42, 0.58);

                    --border: rgba(148, 163, 184, 0.14);
                    --border-strong: rgba(148, 163, 184, 0.24);

                    --text-main: #f8fafc;
                    --text-muted: #94a3b8;
                    --text-soft: #cbd5e1;

                    --blue: #2563eb;
                    --blue-light: #60a5fa;
                    --green: #22c55e;
                    --red: #ef4444;
                    --yellow: #f59e0b;

                    --radius-lg: 24px;
                    --radius-md: 16px;
                    --shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
                }

                * {
                    box-sizing: border-box;
                }

                html {
                    scroll-behavior: smooth;
                }

                body {
                    margin: 0;
                    min-height: 100vh;
                    font-family: Inter, Arial, Helvetica, sans-serif;
                    color: var(--text-main);
                    background:
                        radial-gradient(circle at top left, rgba(37, 99, 235, 0.32), transparent 32%),
                        radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.14), transparent 34%),
                        linear-gradient(135deg, #020617 0%, var(--bg-main) 52%, #0f172a 100%);
                }

                a {
                    color: inherit;
                }

                .app-shell {
                    display: grid;
                    grid-template-columns: 260px 1fr;
                    min-height: 100vh;
                }

                .sidebar {
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    padding: 24px 18px;
                    border-right: 1px solid var(--border);
                    background: rgba(2, 6, 23, 0.62);
                    backdrop-filter: blur(18px);
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 34px;
                    padding: 8px;
                }

                .logo-mark {
                    width: 42px;
                    height: 42px;
                    border-radius: 14px;
                    display: grid;
                    place-items: center;
                    background: linear-gradient(135deg, var(--blue), #1e40af);
                    box-shadow: 0 0 34px rgba(37, 99, 235, 0.45);
                    font-weight: 900;
                    letter-spacing: -1px;
                }

                .logo-text strong {
                    display: block;
                    font-size: 16px;
                    letter-spacing: -0.3px;
                }

                .logo-text span {
                    display: block;
                    margin-top: 3px;
                    color: var(--text-muted);
                    font-size: 12px;
                }

                .nav-label {
                    margin: 20px 10px 10px;
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.9px;
                }

                .nav {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }

                .nav a {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 13px;
                    border-radius: 14px;
                    text-decoration: none;
                    color: var(--text-soft);
                    font-size: 14px;
                    font-weight: 700;
                    transition: 0.18s ease;
                }

                .nav a:hover,
                .nav a.active {
                    background: rgba(37, 99, 235, 0.16);
                    color: #dbeafe;
                }

                .sidebar-footer {
                    position: absolute;
                    left: 18px;
                    right: 18px;
                    bottom: 22px;
                    padding: 14px;
                    border: 1px solid var(--border);
                    border-radius: 18px;
                    background: rgba(15, 23, 42, 0.68);
                }

                .sidebar-footer span {
                    display: block;
                    color: var(--text-muted);
                    font-size: 12px;
                    margin-bottom: 6px;
                }

                .sidebar-footer strong {
                    font-size: 14px;
                }

                .main {
                    min-width: 0;
                    padding: 28px;
                }

                .topbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 18px;
                    margin-bottom: 24px;
                }

                .page-title h1 {
                    margin: 0;
                    font-size: clamp(28px, 4vw, 42px);
                    letter-spacing: -1.2px;
                }

                .page-title p {
                    margin: 9px 0 0;
                    color: var(--text-muted);
                    font-size: 15px;
                }

                .top-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    border: 1px solid var(--border-strong);
                    border-radius: 999px;
                    background: rgba(15, 23, 42, 0.64);
                    color: var(--text-soft);
                    font-size: 13px;
                    font-weight: 700;
                    white-space: nowrap;
                }

                .dot {
                    width: 9px;
                    height: 9px;
                    border-radius: 999px;
                    background: var(--green);
                    box-shadow: 0 0 18px var(--green);
                }

                .hero {
                    position: relative;
                    overflow: hidden;
                    border: 1px solid var(--border);
                    border-radius: 28px;
                    padding: 24px;
                    margin-bottom: 20px;
                    background:
                        linear-gradient(135deg, rgba(37, 99, 235, 0.20), rgba(34, 197, 94, 0.08)),
                        rgba(15, 23, 42, 0.72);
                    box-shadow: var(--shadow);
                }

                .hero::after {
                    content: "";
                    position: absolute;
                    width: 220px;
                    height: 220px;
                    right: -80px;
                    top: -80px;
                    border-radius: 999px;
                    background: rgba(96, 165, 250, 0.14);
                    filter: blur(4px);
                }

                .hero-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 18px;
                }

                .hero h2 {
                    margin: 0;
                    font-size: 22px;
                    letter-spacing: -0.4px;
                }

                .hero p {
                    max-width: 720px;
                    margin: 8px 0 0;
                    color: var(--text-muted);
                    line-height: 1.5;
                }

                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .stat {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    padding: 18px;
                    box-shadow: 0 18px 45px rgba(0,0,0,0.22);
                }

                .stat span {
                    color: var(--text-muted);
                    font-size: 13px;
                    font-weight: 700;
                }

                .stat strong {
                    display: block;
                    margin-top: 8px;
                    font-size: 26px;
                    letter-spacing: -0.6px;
                }

                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 18px;
                }

                .card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    padding: 24px;
                    box-shadow: 0 24px 55px rgba(0,0,0,0.26);
                    backdrop-filter: blur(16px);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    align-items: flex-start;
                    margin-bottom: 18px;
                }

                .card h2 {
                    margin: 0;
                    font-size: 22px;
                    letter-spacing: -0.4px;
                }

                .card small {
                    display: block;
                    margin-top: 7px;
                    color: var(--text-muted);
                }

                .status-pill {
                    padding: 7px 11px;
                    border-radius: 999px;
                    font-weight: 900;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                    white-space: nowrap;
                }

                .online {
                    background: rgba(34, 197, 94, 0.14);
                    color: #4ade80;
                    border: 1px solid rgba(74, 222, 128, 0.25);
                }

                .offline {
                    background: rgba(239, 68, 68, 0.14);
                    color: #f87171;
                    border: 1px solid rgba(248, 113, 113, 0.25);
                }

                .warning {
                    background: rgba(245, 158, 11, 0.14);
                    color: #fbbf24;
                    border: 1px solid rgba(251, 191, 36, 0.25);
                }

                .info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 18px 0;
                }

                .info-item {
                    background: var(--bg-soft);
                    border: 1px solid rgba(148, 163, 184, 0.10);
                    border-radius: 15px;
                    padding: 14px;
                }

                .info-item span {
                    display: block;
                    color: var(--text-muted);
                    font-size: 12px;
                    margin-bottom: 6px;
                    font-weight: 700;
                }

                .info-item strong {
                    font-size: 15px;
                }

                .actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 18px;
                }

                button,
                .button-link {
                    border: 0;
                    border-radius: 13px;
                    padding: 12px 16px;
                    font-weight: 900;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: transform 0.15s ease, opacity 0.15s ease, border 0.15s ease;
                }

                button:hover,
                .button-link:hover {
                    transform: translateY(-1px);
                    opacity: 0.94;
                }

                button:active,
                .button-link:active {
                    transform: translateY(0);
                }

                .primary {
                    background: linear-gradient(135deg, var(--blue), #1d4ed8);
                    color: white;
                    box-shadow: 0 14px 28px rgba(37, 99, 235, 0.26);
                }

                .secondary {
                    background: rgba(15, 23, 42, 0.82);
                    color: #bfdbfe;
                    border: 1px solid rgba(147, 197, 253, 0.20);
                }

                .danger {
                    background: rgba(239, 68, 68, 0.15);
                    color: #fca5a5;
                    border: 1px solid rgba(248, 113, 113, 0.22);
                }

                .ghost {
                    background: transparent;
                    color: var(--text-soft);
                    border: 1px solid var(--border);
                }

                code {
                    color: #bfdbfe;
                    background: rgba(15, 23, 42, 0.75);
                    padding: 3px 7px;
                    border-radius: 7px;
                    font-size: 13px;
                }

                pre {
                    background: rgba(2, 6, 23, 0.90);
                    border: 1px solid rgba(148, 163, 184, 0.14);
                    padding: 22px;
                    border-radius: 18px;
                    white-space: pre-wrap;
                    overflow: auto;
                    line-height: 1.5;
                    color: #dbeafe;
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
                }

                .footer {
                    margin-top: 28px;
                    color: #64748b;
                    font-size: 13px;
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                @media (max-width: 900px) {
                    .app-shell {
                        grid-template-columns: 1fr;
                    }

                    .sidebar {
                        position: relative;
                        height: auto;
                        border-right: 0;
                        border-bottom: 1px solid var(--border);
                    }

                    .sidebar-footer {
                        position: static;
                        margin-top: 18px;
                    }

                    .nav {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                    }

                    .main {
                        padding: 22px;
                    }

                    .topbar,
                    .hero-content {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }

                @media (max-width: 600px) {
                    .main {
                        padding: 18px;
                    }

                    .info {
                        grid-template-columns: 1fr;
                    }

                    .card {
                        padding: 20px;
                    }

                    .top-actions {
                        width: 100%;
                    }

                    .badge {
                        width: 100%;
                        justify-content: center;
                    }
                }
            </style>
        </head>

        <body>
            <div class="app-shell">

                <aside class="sidebar">
                    <div class="logo">
                        <div class="logo-mark">M</div>
                        <div class="logo-text">
                            <strong>M1000gt Control</strong>
                            <span>AI Business Panel</span>
                        </div>
                    </div>

                    <div class="nav-label">Operação</div>
                    <nav class="nav">
                        <a class="${active('dashboard')}" href="/">🏠 Dashboard</a>
                        <a class="${active('clientes')}" href="/clientes">🏢 Clientes</a>
                        <a class="${active('qr')}" href="/qr">📲 QR Code</a>
                        <a class="${active('logs')}" href="/logs">📄 Logs</a>
                    </nav>

                    <div class="nav-label">Sistema</div>
                    <nav class="nav">
                        <a class="${active('config')}" href="/config">⚙️ Configurações</a>
                        <a class="${active('status')}" href="/status">🟢 Status geral</a>
                    </nav>

                    <div class="sidebar-footer">
                        <span>Modo de operação</span>
                        <strong>Multi-clientes ativo</strong>
                    </div>
                </aside>

                <main class="main">
                    <section class="topbar">
                        <div class="page-title">
                            <h1>Painel do Gustavo</h1>
                            <p>Controle seus assistentes virtuais, sessões do WhatsApp, logs e operações em tempo real.</p>
                        </div>

                        <div class="top-actions">
                            <div class="badge">
                                <span class="dot"></span>
                                Sistema online
                            </div>

                            <div class="badge">
                                IA operacional
                            </div>
                        </div>
                    </section>

                    <section class="hero">
                        <div class="hero-content">
                            <div>
                                <h2>Central M1000gt</h2>
                                <p>
                                    Painel privado para gerenciar bots, clientes, QR Codes, reinicializações e monitoramento
                                    dos assistentes virtuais com IA.
                                </p>
                            </div>

                            <a class="button-link primary" href="/qr">
                                Abrir QR Code
                            </a>
                        </div>
                    </section>

                    ${content}

                    <div class="footer">
                        <span>M1000gt • Assistentes IA • Operação multi-clientes</span>
                        <span>Painel privado de controle</span>
                    </div>
                </main>

            </div>
        </body>
        </html>
    `;
}

app.get('/', async (req, res) => {
    const clientes = carregarClientes();

    let onlineCount = 0;
    let cards = '';

    for (const bot of clientes) {
        const data = await getBotStatus(bot.pm2);
        const isOnline = data.status === 'online';

        if (isOnline) onlineCount++;

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

                    <a class="button-link secondary" href="/logs/${encodeURIComponent(bot.pm2)}">Ver logs técnicos</a>\n\n                    <a class="button-link secondary" href="/conversas/${encodeURIComponent(bot.pm2)}">Ver conversas</a>

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

    res.send(layout(content));
});

app.post('/restart/:pm2', async (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    await run(`pm2 restart ${bot.pm2}`);
    res.redirect('/');
});

app.get('/logs/:pm2', async (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    const logs = await run(`pm2 logs ${bot.pm2} --lines 100 --nostream`);

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

    res.send(layout(content));
});


app.get('/conversas/:pm2', async (req, res) => {
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

    res.send(layout(content));
});


app.get('/qrcode/:pm2', async (req, res) => {
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

    res.send(layout(content));
});

app.get('/qrcode-image/:pm2', (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot || !bot.qrImage || !fs.existsSync(bot.qrImage)) {
        return res.status(404).send('QR Code não encontrado.');
    }

    res.sendFile(bot.qrImage);
});

app.listen(PORT, () => {
    console.log(`✅ Dashboard M1000gt Control rodando na porta ${PORT}`);
});
