const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const qrImagePath = path.join(__dirname, 'qrcode.png');
const qrStatusPath = path.join(__dirname, 'qrcode-status.json');

function salvarStatus(status, extra = {}) {
    const data = {
        status,
        updatedAt: new Date().toISOString(),
        ...extra
    };

    fs.writeFileSync(qrStatusPath, JSON.stringify(data, null, 2));
}

module.exports = function ativarQRCodeSeguro(client) {
    client.on('qr', async (qr) => {
        try {
            await QRCode.toFile(qrImagePath, qr, {
                width: 420,
                margin: 2
            });

            salvarStatus('aguardando_qr');

            console.log('📲 QR Code salvo para o dashboard.');
        } catch (error) {
            console.error('Erro ao salvar QR Code:', error);
            salvarStatus('erro_qrcode', { erro: error.message });
        }
    });

    client.on('ready', () => {
        salvarStatus('conectado');

        if (fs.existsSync(qrImagePath)) {
            fs.unlinkSync(qrImagePath);
        }

        console.log('✅ WhatsApp conectado. QR Code removido do dashboard.');
    });

    client.on('authenticated', () => {
        salvarStatus('autenticado');
    });

    client.on('disconnected', (reason) => {
        salvarStatus('desconectado', { motivo: reason });
    });
};
