import _ from 'lodash';
import Storage from '../utils/storage';

class produtoUtils{

    getTamanhosLabelProduto(produto) {
        const tamanhos = [];
        let labels = [];
        for (let index = 0; index < produto.cores.length; index++) {
            const cor = produto.cores[index];
            if (cor.tamanhos && cor.tamanhos.length > 0) {
                for (let index = 0; index < cor.tamanhos.length; index++) {
                    const tamanho = cor.tamanhos[index];
                    if (_.indexOf(tamanhos, tamanho.codigo) == -1) {
                        tamanhos.push(tamanho.codigo);
                        labels.push({codigo: tamanho.codigo, ativo: true, seq: tamanho.seq});
                    }
                }
            }
        }
        return labels;
    }

    getTamanhosCor(cor) {
        const carrinho = Storage.getCarrinho();
        if (cor.tamanhos && cor.tamanhos.length > 0) {
            return cor.tamanhos.map((tamanho) => {
                const itemCarrinho = _.find(carrinho.itens, (item) => item.id == tamanho.id);
                if (itemCarrinho) {
                    tamanho.quantidade = itemCarrinho.quantidade;
                }
                return tamanho;
            });
        } else {
            return [];
        }
    }

    getCoresProduto(produto) {
        return produto.cores.map((cor) => {
            return {codigo: cor.codigo, ativo: true, idCor: cor.idCor, idProduto: cor.idProduto, tamanhos: cor.tamanhos};
        });
    }

    createProdutosAddCarrinho(produtos) {
        return new Promise((resolve) => {
            produtos = produtos.filter((produto) => produto != undefined);
            const produtosAdd = produtos.reduce((produtosAdd, produto) => {
                produto.produtoAddCores = this.getCoresProduto(produto);
                produto.produtoLabelTamanhos = this.getTamanhosLabelProduto(produto);
                produto.produtoAddCores = produto.produtoAddCores.map((cor) => {
                    cor.produtoAddTamanhos = this.getTamanhosCor(cor);
                    delete cor.tamanhos;
                    return cor;
                });
                produtosAdd.push(produto);
                return produtosAdd;
            }, []);
            resolve(produtosAdd);
        });
    }

    criaPaginaProdutoSearch(produto) {
        return new Promise((resolve) => {
            const novaPagina = {};
            novaPagina.pag = 0;
            novaPagina.produtoA = {
                id: produto.cores[0].idProduto,
                ref: produto.referencia,
                seq: 1
            };
            resolve(novaPagina);
        });
    }

    addProdutoSearchFromPages(paginas, produto) {
        return new Promise((resolve) => {
            this.criaPaginaProdutoSearch(produto).then((pagina) => {
                paginas.push(pagina);
                resolve(paginas);
            });
        });
    }

    getProdutosSegmentos(segmentos, produtos) {
        return segmentos.reduce((produtosSegmentos, segmento) => {
            produtosSegmentos[segmento.id] = produtos.filter((produto) => produto.segmento.indexOf(segmento.id) > -1 );
            return produtosSegmentos;
        }, {});
    }

    calcularPreco(itemCor) {
        const percentual = Number(Storage.getGrupoCarrinho().porcentagem);
        const precoProduto = itemCor.precoCusto;
        return _.round(precoProduto + ((percentual/100) * precoProduto), 2);
    }

    calcularCarrinho(carrinho) {
        return new Promise((resolve) => {
            carrinho.valorTotal = 0;
            const done = _.after(carrinho.itens.length, () => resolve(carrinho));
            carrinho.itens.forEach((item) => {
                const precoProduto = this.calcularPreco(item);
                carrinho.valorTotal = _.round(carrinho.valorTotal + (item.quantidade * precoProduto), 2);
                done();
            });
        });
    }

}

export default new produtoUtils();