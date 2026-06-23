const express = require('express');
const basicAuth = require('express-basic-auth');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
const DASH_USER = process.env.DASH_USER || 'gustavo';
const DASH_PASS = process.env.DASH_PASS || 'troque-essa-senha';


app.use(basicAuth({
    users: { [DASH_USER]: DASH_PASS },
    challenge: true
}));

const layout = require('./src/views/layout');
const escapeHtml = require('./src/utils/escapeHtml');
const { carregarClientes, encontrarCliente } = require('./src/services/clientesService');
const { carregarControle, salvarControle } = require('./src/services/controleService');
const { getBotStatus, restartBot, getPm2Logs } = require('./src/services/pm2Service');


app.get('/', async (req, res) => {
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

    res.send(layout(content));
});

app.post('/restart/:pm2', async (req, res) => {
    const bot = encontrarCliente(req.params.pm2);

    if (!bot) {
        return res.status(404).send('Bot não encontrado.');
    }

    await restartBot(bot.pm2);
    res.redirect('/');
});

app.post('/toggle-auto-reply/:pm2', (req, res) => {
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

app.get('/logs/:pm2', async (req, res) => {
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



app.get('/clientes', async (req, res) => {
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

app.get('/qr', async (req, res) => {
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

app.get('/logs', async (req, res) => {
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

                    ${bot.leadsLog ? `<a class="button-link secondary" href="/leads/${encodeURIComponent(bot.pm2)}">Ver leads</a>` : ``}
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

app.get('/status', async (req, res) => {
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

app.get('/config', (req, res) => {
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



app.get('/leads', async (req, res) => {
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

app.get('/leads/:pm2', async (req, res) => {
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


app.listen(PORT, () => {
    console.log(`✅ Dashboard M1000gt Control rodando na porta ${PORT}`);
});
