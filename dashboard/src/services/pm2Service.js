const { run } = require('./commandService');

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

async function restartBot(pm2Name) {
    return run(`pm2 restart ${pm2Name}`);
}

async function getPm2Logs(pm2Name, lines = 100) {
    return run(`pm2 logs ${pm2Name} --lines ${lines} --nostream`);
}

module.exports = {
    getBotStatus,
    restartBot,
    getPm2Logs
};
