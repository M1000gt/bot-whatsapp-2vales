const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');

const dashboardRoutes = require('./src/routes/dashboardRoutes');
const clientesRoutes = require('./src/routes/clientesRoutes');
const logsRoutes = require('./src/routes/logsRoutes');
const qrRoutes = require('./src/routes/qrRoutes');
const leadsRoutes = require('./src/routes/leadsRoutes');
const sistemaRoutes = require('./src/routes/sistemaRoutes');
const actionsRoutes = require('./src/routes/actionsRoutes');

const app = express();

const PORT = process.env.PORT || 3000;
const DASH_USER = process.env.DASH_USER || 'gustavo';
const DASH_PASS = process.env.DASH_PASS || 'troque-essa-senha';

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(basicAuth({
    users: { [DASH_USER]: DASH_PASS },
    challenge: true
}));

app.use('/', dashboardRoutes);
app.use('/', clientesRoutes);
app.use('/', logsRoutes);
app.use('/', qrRoutes);
app.use('/', leadsRoutes);
app.use('/', sistemaRoutes);
app.use('/', actionsRoutes);

app.listen(PORT, () => {
    console.log(`✅ Dashboard M1000gt Control rodando na porta ${PORT}`);
});
