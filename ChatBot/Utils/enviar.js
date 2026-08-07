const delay =
require('./delay');

async function enviar(
    client,
    destino,
    mensagem,
    opcoes = {}
) {

    try {

        if (!client || !client.info) {
            throw new Error('Cliente do WhatsApp não está conectado.');
        }

        await delay(150);

        return await client.sendMessage(
            destino,
            mensagem,
            opcoes
        );

    } catch (err) {

        console.error('Erro envio:', err.message || err);

        throw err;

    }

}

module.exports = enviar;
