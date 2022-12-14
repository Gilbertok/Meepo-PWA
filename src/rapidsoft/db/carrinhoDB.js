/*=========================================================================================
  File Name: carrinhoDB.js
  Description: Classe de banco do carrinho
  ----------------------------------------------------------------------------------------
  Author: Giba
==========================================================================================*/
import BasicRemoteDB from './basicRemoteDB';
import Storage from '../utils/storage';
import IsEqual from 'lodash/isEqual';

class carrinhoDB extends BasicRemoteDB {

    constructor() {
        super("carrinho");
    }

    getCarrinho(rev = false) {
        return new Promise((resolve) => {
            this._localDB.get("1").then((result) => {
                if (!rev) delete result._rev;
                Storage.setCarrinho(result);
                resolve(result);
            }).catch(() => {
                const cliente = Storage.getClienteCarrinho();
                let newCarrinho = {};
                newCarrinho._id = "1";
                newCarrinho.valorTotal = 0;
                newCarrinho.itens = [];   
                if (cliente) {
                    newCarrinho.cliente = cliente;
                } else {
                    const grupoCliente = Storage.getGrupoCarrinho();
                    newCarrinho.cliente = { cpfCnpj: null, nome: null, grupoCliente };
                }
                resolve(newCarrinho);
            });
        });
    }

    getConflitoCarrinhos() {
        return new Promise((resolve, reject) => {
            this._localDB.get("1", {conflicts: true}).then((carrinhoAtual) => {
                const carrinhos = [carrinhoAtual];

                if (carrinhoAtual._conflicts && carrinhoAtual._conflicts.length > 0) {
                    carrinhoAtual._conflicts.map((rev) => {
                        this._localDB.get("1", {rev: rev}).then((result) => {
                            carrinhos.push(result);
                        });
                    });
                }

                resolve(carrinhos);
            }).catch((error) => {
                console.log(error);
                reject();
            });
        });
    }

    RemoverConflitoCarrinhos(carrinhos, revManter) {
        return new Promise((resolve) => {
            carrinhos.map((carrinho) => {
                if (carrinho._rev !== revManter) {
                    console.log('excluir',carrinho._rev, revManter);
                    this._localDB.remove("1", carrinho._rev).then(() => {
                        resolve();
                    });
                }
            });
        });
    }

    setCarrinho(carrinho) {
        return new Promise((resolve) => {
            this.getCarrinho(true).then((carrinhoDB)=> {
                carrinho._rev = carrinhoDB._rev;
                if (!IsEqual(carrinhoDB,carrinho)) {
                    carrinho._id = "1";
                    carrinho.alterado = true;
                    carrinho.valorTotal = this.getValorTotalCarrinho(carrinho.itens);
                    this._localDB.put(carrinho).then((result) => {
                        Storage.setCarrinho(carrinho);
                        resolve(result);
                    }).catch((erro) => {
                        if (erro.status == 409) {
                            this._localDB.get("1", {conflicts: true}).then((carrinhoBanco) => {
                                resolve(carrinhoBanco);
                            });
                        } else {
                            this._criarLogDB({url:'db/carrinhoDB', method:'setCarrinho', message: erro, error:'Failed Request'});
                            resolve(erro);
                        }
                    });
                } else {
                    resolve(carrinho);
                }
            });
        });
    }

    deleteCarrinho(itens = []) {
        return new Promise((resolve) => {
            if (itens.length > 0) {
                this.getCarrinho().then((carrinho) => {
                    carrinho.itens = carrinho.itens.filter((itemCarrinho) => !(itens.some((itemDelete) => itemDelete === itemCarrinho.sku || itemDelete === itemCarrinho.idProduto)));
                    if (carrinho.itens.length > 0) {
                        Storage.setCarrinho(carrinho);
                        this.setCarrinho(carrinho).then(resolve());
                    } else {
                        this.deleteCarrinho().then(() => {
                            resolve();
                        });
                    }
                });
            } else {
                this.getCarrinho(true).then((carrinho) => {
                    this._localDB.remove(carrinho).then((result) => {
                        Storage.deleteCarrinho();
                        resolve(result);
                    }).catch((error) => {
                        console.log('erro deletar carrinho', carrinho, error);
                        resolve();
                    });
                });
            }
        });
    }

    getValorTotalCarrinho(itens) {
        return Number(itens.reduce((total, item) => {
            total = total + (item.quantidade * item.precoCusto);
            return total;
        }, 0).toFixed(2));
    }

    getCouchDB() {
        return new Promise((resolve) => {
            this._remoteDB.get("1").then((carrinhoCouch) => {
                delete carrinhoCouch._rev;
                this.setCarrinho(carrinhoCouch).then(() => {
                    resolve();
                });
            }).catch(() => {
                resolve();
            });
        });
    }

}

export default new carrinhoDB();    