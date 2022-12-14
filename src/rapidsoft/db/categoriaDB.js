/*=========================================================================================
  File Name: categoriaDB.js
  Description: Classe de banco de categorias
  ----------------------------------------------------------------------------------------
  Author: Giba
==========================================================================================*/

import After from 'lodash/after';
import BasicDB from './basicDB';
import ProdutoDB from './produtoDB';

class categoriaDB extends BasicDB {

    constructor() {
        super("categoria");
        this._createIndex('id');
    }

    salvarSinc(categorias) {
        return new Promise((resolve) => {
            this._limparBase().then(() => {
                if(categorias.length > 0) {
                    const done = After(categorias.length, () => resolve());
                    categorias.forEach(categoria => {
                        this._salvar(categoria).then(() => done()).catch(() => done());
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    getByIds(idsCategorias) {
        return new Promise((resolve) => {
            this._getFindCondition({id : {$in : idsCategorias}}).then((categorias) => {
                resolve(categorias);
            });
        });
    }

    getAllBySegmento(idSegmento) {
        return new Promise((resolve) => {
            ProdutoDB.getIdsCategoria().then((idsCategorias) => {
                this.getByIds(idsCategorias).then((categorias) => {
                    resolve(categorias.filter((categoria) => categoria.idSegmento === idSegmento));
                });
            });
        });
    }

}

export default new categoriaDB();