/*=========================================================================================
  File Name: produtoDB.js
  Description: Classe de banco de Produtos
  ----------------------------------------------------------------------------------------
  Author: Giba
==========================================================================================*/

import _ from 'lodash';
import arrayMove from 'array-move';
import BasicDB from './basicDB';
import ImagemDB from './imagemDB';
import CatalogoDB from './catalogoDB';
import EmbarqueDB from './embarqueDB';
import CategoriaDB from './categoriaDB';


const getProdutoToDBFilterCategoria = (produtos, idsCategorias, textoSearch) => {
    
    textoSearch = _.toUpper(textoSearch);
    return produtos.filter((produto) => {
        return textoSearch === null || textoSearch === "" || _.toUpper(produto.referencia).includes(textoSearch) || produto.nome.includes(textoSearch);
    }).filter((produto) => {
        return idsCategorias.length === 0 || produto.cores.some((cor) => {
            return cor.categorias.some((categoria) => {
                return idsCategorias.some((idCategoria) => {
                    return categoria === idCategoria;
                });
            });
        });
    });
};

const getProdutoToDBCategoria = (produtos, idCategoria) => {
    return produtos.filter((produto) => {
        return idCategoria.length === 0 || produto.cores.some((cor) => {
            return cor.categorias.some((categoria) => {
                return categoria === idCategoria;
            });
        });
    });
};

const getCoresAtivas = (cores) => {
    return cores.filter((cor) => {
        return cor.ativo;
    });
};

const getReferenciasCarrinho = (carrinho) => {
    return carrinho.itens.map((produto) => {
        return produto.ref;
    });
};

class produtoDB extends BasicDB {

    constructor() {
        super("produto");
        this._createIndex('referencia');
    }

    getAllProdutos() {
        return new Promise((resolve) => {
            this._getFindCondition({referencia : {$gte : null}}).then((produtos) => {
                resolve(produtos);
            });
        });
    }

    getProdutosByIdCategorias(idCategoria) {
        
        return new Promise((resolve) => {
                this.getAllProdutos().then((produtos) => {
                    resolve(getProdutoToDBCategoria(produtos, idCategoria));
                });
        });
    }

    getAllProdutosByIdCategorias(idCategorias, textoSearch) {
        
        return new Promise((resolve) => {
            if (idCategorias.length > 0 || textoSearch.length > 0) {
                this.getAllProdutos().then((produtos) => {
                    resolve(getProdutoToDBFilterCategoria(produtos, idCategorias, textoSearch));
                });
            } else {
                resolve([]);
            }
        });
    }

    getTamanhosProdutoCarrinho(tamanhos, carrinho) {
        return new Promise((resolve) => {
            const tamanhoResult = [];
            const done = _.after(tamanhos.length, () => resolve(tamanhoResult));
            tamanhos.forEach(tamanho => {
                const itemQuantidade = _.find(carrinho.itens, (item) => item.id === tamanho.id);
                tamanho.quantidade = itemQuantidade ? itemQuantidade.quantidade : 0;
                tamanhoResult.push(tamanho);
                done();
            });
        });   
    }

    getTotalCor(tamanhos, carrinho) {
        return new Promise((resolve) => {
            let totalCor = 0;   
            const done = _.after(tamanhos.length, () => resolve(totalCor));
            
            tamanhos.forEach(tamanho => {
                const itemQuantidade = _.find(carrinho.itens, (item) => item.id === tamanho.id);
                totalCor = totalCor + (itemQuantidade ? itemQuantidade.quantidade : 0);
                done();
            });
        });
    }

    getProdutoFromCarrinho(produto, carrinho) {
        return new Promise((resolve) => {
            const produtoCores = [];
            const done = _.after(produto.cores.length, () => resolve(produtoCores));
            
            produto.cores.forEach(cor => {
                const produtoCor = _.clone(produto);
                produtoCor.cor = _.clone(cor);
                this.getTotalCor(produtoCor.cor.tamanhos, carrinho).then((totalCor) => {
                    produtoCor.cor.quantidade = totalCor;
                    if (produtoCor.cor.quantidade > 0) {
                        this.getTamanhosProdutoCarrinho(produtoCor.cor.tamanhos, carrinho).then((tamanhos) => {
                            produtoCor.cor.tamanhos = tamanhos;
                            const imagemPrincipal = _.orderBy(produtoCor.cor.imagens, ['seq'])[0];
                            ImagemDB.getFotoById(imagemPrincipal.id).then(imagem => {
                                produtoCor.imagemPrincipal = imagem;
                                EmbarqueDB.getEmbarqueProduto(produtoCor).then((embarque) => {
                                    produtoCor.embarque = embarque;
                                    produtoCor.segmento = produtoCor.segmento[0];
                                    delete produtoCor['cores'];
                                    delete produtoCor['video'];
                                    delete produtoCor['_rev'];
                                    delete produtoCor.cor['selos'];
                                    delete produtoCor.cor['simbolos'];
                                    delete produtoCor.cor['produtosLook'];
                                    delete produtoCor.cor['prontaEntrega'];
                                    delete produtoCor.cor['imagens'];
                                    produtoCores.push(produtoCor);
                                    done();
                                });
                            });                
                        });
                    } else {
                        done();
                    }
                });
            });
        });        
    }

    getProdutosFromCarrinho(carrinho) {
        return new Promise((resolve) => {
            const produtosCor = [];
            const refsCarrinho = getReferenciasCarrinho(carrinho);
            this._getFindCondition({referencia : {$in : refsCarrinho}}).then((produtos) => {
                const done = _.after(produtos.length, () => resolve(_.flattenDeep(produtosCor)));                
                produtos.forEach(produto => {
                    produto.cores = produto.cores.filter((cor) => _.findIndex(carrinho.itens, (item) => item.cor === cor.idCor) >= 0 );
                    this.getProdutoFromCarrinho(produto, carrinho).then((produtoCor) => {
                        produtosCor.push(produtoCor);
                        done();
                    });
                });
            });
        });
    }

    getPaginasByCategorias(idCategoria, paginas) {
        return new Promise((resolve) => {

            const paginasCategoria = [];

            paginas.map((pagina) => {
                pagina.categorias.map((categoria) => {
                    if (categoria === idCategoria) {
                        paginasCategoria.push(pagina); 
                    }
                });
            });
            resolve(paginasCategoria);
        });
    }

    getPaginasCatalogo(idCatalogo, idCategoria = null) {
        return new Promise((resolve) => {
            CatalogoDB.getById(idCatalogo).then((catalogo) =>{
                
                this.getProdutosFromPaginas(_.orderBy(catalogo.paginas, ['pag'], ['asc'])).then((produtos) => {
                    let categoriasPagina = [];
                    produtos.map((pagina) => {
                        pagina.categorias = [];
                        for (const key in pagina) {
                            if (pagina.hasOwnProperty(key) && key !== 'idFoto' && key !== 'pag') {
                                categoriasPagina = _.concat(categoriasPagina,pagina[key].cat);
                                pagina.categorias = _.concat(pagina.categorias,pagina[key].cat);
                            }
                        }
                    });
                    
                    categoriasPagina = categoriasPagina.filter( function( categoria, indice, array ) {
                        return array.indexOf( categoria ) === indice;
                    } );

                    if (idCategoria) {
                        this.getPaginasByCategorias(idCategoria,catalogo.paginas).then((paginas) => {
                            produtos = paginas;
                        });
                    }

                    produtos.categorias = categoriasPagina
                    
                    CategoriaDB.getByIds(categoriasPagina).then((cat) => {
                        produtos.categorias = cat;
                        resolve(produtos);
                    });

                });
            });
        });
    }

    getProdutosFromPaginas(paginas) {
        return new Promise((resolve) => {
            const paginasProdutos = paginas.map((pagina) => {
                const prodOrderSeq = _.orderBy(pagina.produtos, ['seq']);
                delete pagina['produtos'];
                pagina.produtoA = prodOrderSeq[0];
                if (prodOrderSeq[1]) {
                    pagina.produtoB = prodOrderSeq[1];
                }
                if (prodOrderSeq[2]) {
                    pagina.produtoC = prodOrderSeq[2];
                }
                if (prodOrderSeq[3]) {
                    pagina.produtoD = prodOrderSeq[3];
                }
                return pagina;
            });
            resolve(paginasProdutos);
        });
    }

    getById(id) {
        return new Promise((resolve) => {
            this._localDB.get(_.toString(id)).then((result) => {
                delete result['_rev'];
                resolve({existe: true, result: result});  
            }).catch((error) => {
                this._criarLogDB({url:'db/produtoDB',method:'getById',message: error,error:'Failed Request'});
                resolve({existe: false, result: error});
            });
        });
    }
    

    getByProdPaginaCatalogo(pagina) {
        return new Promise((resolve) => {
            if (pagina && (pagina.ref || pagina.referencia)) {
                this.getById(pagina.ref || pagina.referencia).then((resultProduto) => {
                    if (resultProduto.existe && resultProduto.result.cores && resultProduto.result.cores.length > 0) {                        
                        resultProduto.result.cores = _.filter(resultProduto.result.cores, (cor) => { return cor.prontaEntrega === false });
                        resultProduto.result.cores = arrayMove(resultProduto.result.cores, _.findIndex(resultProduto.result.cores, (cor) => { return cor.idProduto == pagina.id }), 0);
                        resultProduto.result.segmento = resultProduto.result.segmento[0];
                        resolve(resultProduto.result);
                    } else {
                        resolve(null)        
                    }
                })
            } else {
                resolve(null)
            }
        });            
    }

    // filtrarProdutosPesquisa(produtos) {
    //     return this.produtos.filter((produto) => {
    //         return this.getCategoriasCardPesquisa.some((categoria) => {
    //             return categoria.check && produto.hasOwnProperty('categoria') && produto.categoria.hasOwnProperty('codigo') && produto.categoria.codigo == categoria.codigo;
    //         });
    //     });
    // }

    getProdutosSearch(idsCategorias, textoSearch) {
        return new Promise((resolve) => {
            this.getAllProdutosByIdCategorias(idsCategorias, textoSearch).then((produtos) => {
                if(produtos.length > 0) {
                    const done = _.after(produtos.length, () => resolve(produtos));
                    produtos.forEach(produto => {
                        if(produto.cores.length > 0) {
                            ImagemDB.getFotoPrincipal(produto).then((result) => {
                                produto.imagemPrincipal = result;
                                done();
                            });
                        } else {
                            done();
                        }
                    });
                }
            });
        });
    }

    possuiCores(produto) {
        return produto && produto.cores && produto.cores.length > 0 && _.isObject(produto.cores[0]);
    }

    getImagensCorProduto(produto) {
        return new Promise((resolve) => {
            if(this.possuiCores(produto)) {
                const done = _.after(produto.cores.length, () => resolve(produto));
                produto.cores.forEach(cor => {
                    ImagemDB.getCorById(cor).then((resultImagemCor) => {
                        cor.imagemCor = resultImagemCor;
                        ImagemDB.getSelos(cor).then((resultSelos) => {
                            cor.selos = resultSelos;
                            ImagemDB.getSimbolos(cor).then((resultSimbolos) => {
                                cor.simbolos = resultSimbolos;
                                done();
                            });
                        });
                    });
                });
            } else {
                resolve(produto);
            }
        });
    }

    getImagensProduto(produto) {
        return new Promise((resolve) => {
            if(this.possuiCores(produto)) {
                const done = _.after(produto.cores.length, () => resolve(produto));
                produto.cores.forEach(cor => {
                    ImagemDB.getCorById(cor).then((resultImagemCor) => {
                        cor.imagemCor = resultImagemCor;
                        ImagemDB.getSelos(cor).then((resultSelos) => {
                            cor.selos = resultSelos;
                            ImagemDB.getSimbolos(cor).then((resultSimbolos) => {
                                cor.simbolos = resultSimbolos;
                                ImagemDB.getFotosProduto(cor).then((resultFotos) => {
                                    cor.imagens = _.orderBy(resultFotos, ['seq'], ['asc']);
                                    done();
                                });
                            });
                        });
                    });
                });
            } else {
                resolve(produto);
            }
        });
    }

    getProdutoEdicaoCarrinho(produto) {
        return new Promise((resolve) => {
            this.getByProdPaginaCatalogo(produto).then((resultProduto) => {
                resolve(resultProduto);
            });
        });
    }

    getProdutoPaginaCatalogo(pagina) {
        return new Promise((resolve) => {
            let item = {};
            this.getByProdPaginaCatalogo(pagina.produtoA).then((resultProdutoA) => {
                if (resultProdutoA) {
                    item.produtoA = resultProdutoA;
                    this.getByProdPaginaCatalogo(pagina.produtoB).then((resultProdutoB) => {
                        if (resultProdutoB != null) {
                            item.produtoB = resultProdutoB;
                        }
                        this.getByProdPaginaCatalogo(pagina.produtoC).then((resultProdutoC) => {
                            if (resultProdutoC != null) {
                                item.produtoC = resultProdutoC;
                            }
                            this.getByProdPaginaCatalogo(pagina.produtoD).then((resultProdutoD) => {
                                if (resultProdutoD != null) {
                                    item.produtoD = resultProdutoD;
                                }
                                if (item.produtoA == null && item.produtoB != null) {
                                    item.produtoA = item.produtoB;
                                    item.produtoB = null;
                                }
                                this.getImagens(item).then((resultImagem) => {
                                    resolve(resultImagem);
                                });
                            });
                        });
                    });
                } else {
                    this._criarLogDB({url:'db/produtoDB',method:'getProdutoPaginaCatalogo',message: 'Produto não encontrado: '+pagina.produtoA,error:'Failed Request'});
                    resolve();
                }
            });
        }).catch((err) => {
            this._criarLogDB({url:'db/produtoDB',method:'getProdutoPaginaCatalogo',message: err,error:'Failed Request'});
        });
    }

    getImagens(item) {
        return new Promise((resolve) => {
            this.getImagensProduto(item.produtoA).then((produtoA) => {
                item.produtoA = produtoA;
                this.getImagensCorProduto(item.produtoB).then((produtoB) => {
                    item.produtoB = produtoB;
                    resolve(item);
                })
            })
        });
    }

    salvar(produto) {
        return new Promise((resolve) => {
            produto._id = produto.referencia;
            this._salvar(produto).then(() => {
                resolve();
            })
        });
    }   

    getIdsFotos(produto) {
        return new Promise((resolve) => {
            const IdsFotos = _.flattenDeep(getCoresAtivas(produto.cores).map((cor) => {
                return cor.imagens.map((imagem) => {
                    return imagem.id.toString();
                });
            }));
            resolve(IdsFotos);
        });
    }

    getIdsCores(produto) {
        return new Promise((resolve) => {
            const IdsCores = _.flattenDeep(getCoresAtivas(produto.cores).filter((cor) => cor != undefined && cor.idCor).map((cor) => {
                return cor.idCor.toString();
            }));
            resolve(IdsCores);
        });
    }

    getIdsSelos(produto) {
        return new Promise((resolve) => {
            const IdsSelos = _.flattenDeep(getCoresAtivas(produto.cores).filter((cor) => cor != undefined && _.isArray(cor.selos)).map((cor) => {
                return cor.selos.map((selo) => selo.toString());
            }));
            resolve(IdsSelos);
        });
    }

    getIdsSimbolos(produto) {
        return new Promise((resolve) => {
            const IdsSimbolos = _.flattenDeep(getCoresAtivas(produto.cores).filter((cor) => cor != undefined && _.isArray(cor.simbolos)).map((cor) => {
                return cor.simbolos.map((simbolo) => simbolo.toString());
            }));
            resolve(IdsSimbolos);
        });
    }

    getIdsImagens() {
        return new Promise((resolve) => {
            const dataResult = {fotos:[], selos:[], simbolos:[], cores:[]};
            this.getAllProdutos().then((produtos) => {
                const done = _.after(produtos.length, () => {
                    const qtdeImagens = dataResult.fotos.length + dataResult.cores.length + dataResult.selos.length + dataResult.simbolos.length;
                    resolve({quantidade: qtdeImagens, data: dataResult});
                });
                produtos.forEach(produto => {
                    this.getIdsFotos(produto).then((idsImagens) => {
                        dataResult.fotos = _.uniq(_.concat(dataResult.fotos, idsImagens));
                        this.getIdsCores(produto).then((idsCores) => {
                            dataResult.cores = _.uniq(_.concat(dataResult.cores, idsCores));
                            this.getIdsSelos(produto).then((idsSelos) => {
                                dataResult.selos = _.uniq(_.concat(dataResult.selos, idsSelos));
                                this.getIdsSimbolos(produto).then((idsSimbolos) => {
                                    dataResult.simbolos = _.uniq(_.concat(dataResult.simbolos, idsSimbolos));
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    getIdsCategoria() {
        return new Promise((resolve) => {
            this.getAllProdutos().then((produtos) => {
                resolve(_.uniq(_.flattenDeep(produtos.map((produto) => {
                    return produto.cores.map((cor) => {
                        return cor.categorias;
                    });
                }))));
            });
        });
    }

    existeNovasImagens() {
        return new Promise((resolve) => {
            this.getIdsImagens().then((idsImagens) => {
                ImagemDB.getIdsNovasFotos(idsImagens.data.fotos).then((idsNovasFotos) => {
                    idsImagens.data.fotos = idsNovasFotos;
                    ImagemDB.getIdsNovasCores(idsImagens.data.cores).then((idsNovasCores) => {
                        idsImagens.data.cores = idsNovasCores;
                        ImagemDB.getIdsNovosSelos(idsImagens.data.selos).then((idsNovosSelos) => {
                            idsImagens.data.selos = idsNovosSelos;
                            ImagemDB.getIdsNovosSimbolos(idsImagens.data.simbolos).then((idsNovosSimbolos) => {
                                idsImagens.data.simbolos = idsNovosSimbolos;
                                idsImagens.quantidade = idsImagens.data.fotos.length + idsImagens.data.cores.length + idsImagens.data.selos.length + idsImagens.data.simbolos.length;
                                resolve(idsImagens);
                            });
                        });
                    });
                });
            });
        });
    }

    removeImagensSemProduto() {
        return new Promise((resolve) => {
            this.getIdsImagens().then((idsImagens) => {
                ImagemDB.getIdsFotosSemProduto(idsImagens.data.fotos).then(() => {
                    ImagemDB.getIdsCoresSemProduto(idsImagens.data.cores).then(() => {
                        ImagemDB.getIdsSelosSemProduto(idsImagens.data.selos).then(() => {
                            ImagemDB.getIdsSimbolosSemProduto(idsImagens.data.simbolos).then(() => {
                                resolve();
                            });
                        });
                    });
                });
            });
        });
    }

}

export default new produtoDB();