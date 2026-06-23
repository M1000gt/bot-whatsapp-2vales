function layout(content, currentPage = 'dashboard') {
    const active = (page) => currentPage === page ? 'active' : '';

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>M1000gt Control</title>
            <link rel="stylesheet" href="/css/dashboard.css">

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
                        <a class="${active('leads')}" href="/leads">🔥 Leads</a>
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

module.exports = layout;
