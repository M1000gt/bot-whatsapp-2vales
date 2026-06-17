const fs = require('fs');
const pdf = require('pdf-parse');

async function extrairCardapio() {
    try {
        const caminhoPdf = './Arquivos/Cardapio.pdf';
        const caminhoSaida = './ana/Prompts/Negocio/Cardapio.txt';

        if (!fs.existsSync(caminhoPdf)) {
            console.log('❌ PDF não encontrado em:', caminhoPdf);
            return;
        }

        const buffer = fs.readFileSync(caminhoPdf);

        const data = await pdf(buffer);

        fs.writeFileSync(
            caminhoSaida,
            `
CARDÁPIO OFICIAL DO 2VALLES RESTAURANTE

Use apenas as informações abaixo.
Não invente pratos, sobremesas, bebidas ou valores.
Se o cliente pedir o cardápio completo, use o marcador [[ENVIAR_CARDAPIO]].

CONTEÚDO EXTRAÍDO DO CARDÁPIO:

${data.text}
`,
            'utf8'
        );

        console.log('✅ Cardápio extraído com sucesso!');
        console.log('📄 Salvo em:', caminhoSaida);

    } catch (err) {
        console.error('❌ Erro ao extrair cardápio:', err);
    }
}

extrairCardapio();