/*=========================================================================================
  File Name: formaPagtoDB.js
  Description: Classe de banco de categorias
  ----------------------------------------------------------------------------------------
  Author: Giba
==========================================================================================*/

import After from 'lodash/after';
import BasicDB from './basicDB';

class formaPagtoDB extends BasicDB {

    constructor() {
        super("forma_pagto");
    }

    getDadosPagamento (idFormaPagamento, idCondicaoPagamento) {
        return new Promise((resolve) => {
            if (idCondicaoPagamento === null) idCondicaoPagamento = 1;
            this._getFindCondition({id : {$eq : idFormaPagamento}}).then((formaPagamentoSelecionada) => {
                this.getCondicaoPagamento(idCondicaoPagamento,formaPagamentoSelecionada[0]).then((condicaoSelecionada) => {
                    this._getAll().then((formasDePagamento) => {
                        resolve({
                            formaPagamentoSelecionada: {
                                value: formaPagamentoSelecionada[0].id, 
                                label: formaPagamentoSelecionada[0].nome,
                                condicoes: formaPagamentoSelecionada[0].condicoes,
                            },
                            condicaoPagamentoSelecionada: condicaoSelecionada,
                            formasDePagamento: formasDePagamento,
                        });
                    });
                });
            });
        });
    }

    getCondicaoPagamento(idCondicaoPagamento, formaPagamentoSelecionada) {
        return new Promise((resolve) => {
            const condicaoSelecionada = formaPagamentoSelecionada.condicoes.find((condicao) => (condicao.id == idCondicaoPagamento));
            resolve({value: condicaoSelecionada.id, label: condicaoSelecionada.nome});
        });
    }

    salvarSinc(formasPagto) {
        return new Promise((resolve) => {
            this._limparBase().then(() => {
                if(formasPagto.length > 0) {
                    const done = After(formasPagto.length, () => resolve());
                    formasPagto.forEach(formPagto => {
                        this._salvar(formPagto).then(() => done()).catch(() => done());
                    });
                } else {
                    resolve();
                }
            });
        });
    }

}

export default new formaPagtoDB();