const delay =
require('./delay');

async function enviar(
    client,
    destino,
    mensagem,
    opcoes = {}
) {

    try {

        if (!client.info)
            return;

        await delay(150);

        return await client.sendMessage(
            destino,
            mensagem,
            opcoes
        );

    } catch (err) {

        console.error(
            'Erro envio:',
            err
        );

    }

}

module.exports = enviar;