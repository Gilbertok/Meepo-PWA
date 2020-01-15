/*=========================================================================================
  File Name: embarqueDB.js
  Description: Classe de banco de embarques
  ----------------------------------------------------------------------------------------
  Author: Giba
==========================================================================================*/

import _ from 'lodash';
import BasicDB from './basicDB';
import Storage from '../utils/storage';

class embarqueDB extends BasicDB {

    constructor() {
        super("embarque");
        this.indexes = ['id', 'idSegmento', 'produtos'];
        this._createIndexes(this.indexes, 'embarque_segmento');
    }

    salvarSinc(embarques) {
        return new Promise((resolve) => {
            this._limparBase().then(() => {
                if(embarques.length > 0) {
                    const done = _.after(embarques.length, () => resolve());
                    embarques.forEach(embarque => {
                        this._salvar(embarque).then(() => done()).catch(() => done());
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    getEmbarqueProduto(produto) {
        return new Promise((resolve) => {
            const grupo = Storage.getGrupoCarrinho();
            const buscaEmbaqueProduto = (embarques) => {
                const embarqueProduto = _.filter(embarques, (embarque) => {
                    this._exists(embarque.produtos, produto.cor.idProduto);
                });
                if (embarqueProduto != null) resolve(embarques[0]);
                else resolve(embarqueProduto);
            };

            this._getFindCondition({$and : [{id : {$in : grupo.embarques}}, {idSegmento : {$in : produto.segmento}}, {produtos : {$in : [produto.cor.idProduto]}}]}).then((embarques) => {
                if (embarques.length > 0) {
                    buscaEmbaqueProduto(embarques);
                } else {
                    this._getFindCondition({$and : [{id : {$gte : null}}, {idSegmento : {$in : produto.segmento}}, {produtos : {$in : [produto.cor.idProduto]}}]}).then((embarques) => {
                        buscaEmbaqueProduto(embarques);
                    });
                }
            });
        });
    }

    getInfosEmbarques(carrinho) {
        return new Promise((resolve) => {
            const grupo = Storage.getGrupoCarrinho();
            const embarques = new Map();
            const done = _.after(carrinho.length, () => resolve([...embarques.values()]));
            carrinho.forEach(produto => {
                if (!embarques.has(produto.embarque.id)) {
                    embarques.set(produto.embarque.id, produto.embarque);
                }
                const embarque = embarques.get(produto.embarque.id);
                embarque.quantidade = (embarque.quantidade || 0 ) + produto.cor.quantidade;
                embarque.valor = ((embarque.valor || 0 ) + produto.cor.precoVenda);
                embarque.valor = _.round(embarque.valor + ((Number(grupo.porcentagem)/100) * embarque.valor), 2);
                embarque.total = embarque.quantidade * embarque.valor;
                embarque.dataEmbarque = embarque.dataInicio;
                done();
            });
        });
    }

    getPedidosPorEmbarques(carrinho) {
        return new Promise((resolve) => {
            const grupo = Storage.getGrupoCarrinho();
            const embarques = new Map();
            const done = _.after(carrinho.length, () => resolve([...embarques.values()]));
            carrinho.forEach(produto => {
                if (!embarques.has(produto.embarque.id)) {
                    embarques.set(produto.embarque.id, produto.embarque);
                }
                const embarque = embarques.get(produto.embarque.id);
                embarque.brinde = false;
                embarque.pedidoParcial = true;
                embarque.antecipacaoPedido = true;
                embarque.copiaEmail = true;
                embarque.quantidade = (embarque.quantidade || 0 ) + produto.cor.quantidade;
                embarque.valor = ((embarque.valor || 0 ) + produto.cor.precoVenda);
                embarque.valor = _.round(embarque.valor + ((Number(grupo.porcentagem)/100) * embarque.valor), 2);
                embarque.total = embarque.quantidade * embarque.valor;
                embarque.dataEmbarque = new Date(_.toNumber(embarque.dataInicio));
                done();
            });
        });
    }

}

export default new embarqueDB();