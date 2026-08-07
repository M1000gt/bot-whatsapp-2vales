function criarFilaPorChave() {
    const filas = new Map();

    function executar(chave, tarefa) {
        if (!chave) {
            return Promise.reject(new Error('A chave da fila é obrigatória.'));
        }

        if (typeof tarefa !== 'function') {
            return Promise.reject(new Error('A tarefa da fila precisa ser uma função.'));
        }

        const anterior = filas.get(chave) || Promise.resolve();

        const atual = anterior
            .catch(() => undefined)
            .then(tarefa);

        filas.set(chave, atual);

        atual.finally(() => {
            if (filas.get(chave) === atual) {
                filas.delete(chave);
            }
        }).catch(() => undefined);

        return atual;
    }

    return {
        executar,
        quantidadePendente: () => filas.size
    };
}

module.exports = {
    criarFilaPorChave
};
