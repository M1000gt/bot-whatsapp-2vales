const fs = require('fs');
const path = require('path');

const CLIENTES_PATH = path.join(__dirname, '../../clientes.json');

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

function encontrarCliente(pm2Name) {
    const clientes = carregarClientes();
    return clientes.find(item => item.pm2 === pm2Name);
}

module.exports = {
    CLIENTES_PATH,
    carregarClientes,
    encontrarCliente
};
