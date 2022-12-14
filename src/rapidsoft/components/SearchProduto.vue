<template>
    <b-modal :id="id" 
        class="w-full" 
        hide-footer 
        >
        <template v-slot:modal-header="{ close }">
            <header class="vs-popup--header">
                <div class="vs-popup--title">
                    <h3>Pesquisa</h3>
                </div>
                <i class="vs-icon notranslate icon-scale vs-popup--close vs-popup--close--icon material-icons null" style="background: rgb(255, 255, 255);" @click.stop="close()">close</i>
            </header>
        </template>
        <div class="vx-row">
            <div class="vx-col sm:w-1/2 w-full">
                <vs-input v-validate="'required'" label="Pesquisar" v-model="textoSearch" class="w-full" />
            </div>
            <div class="vx-col sm:w-1/2 w-full mb-2">
                <label for="segmentoFiltro" class="vs-input--label">Segmentos</label>
                <v-select id="segmentoFiltro" name="segmento" v-model="segmentoSelecionado" label="nome" :clearable="false" :options="getSegmentosSearch"/>
            </div>
        </div>
        <div class="vx-col w-full mb-2">
            <label for="categoriaFiltro" class="vs-input--label">Categorias</label>
            <v-select multiple id="categoriaFiltro" name="segmento" v-model="categoriasSelecionadas" label="nome" :options="getCategoriasSearch"/>
        </div>
        <div style="height: 65vh;overflow:scroll;overflow-x: hidden;">
        <template>
            <div id="div-with-loading-search" class="vx-row vs-con-loading__container vs-con-loading-search">
                <div class="vx-col px-2 lg:w-1/4 md:w-1/4 sm:w-1/3 mb-4" :key="indextr" v-for="(produto, indextr) in listaProdutosPesquisa" @click="selectSearchProduto(produto)">
                    <vx-card class="text-center cursor-pointer" style="box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.2);height:100%;">
                        <b-card-text style="display:flex;align-items:center;justify-content:center;">
                            <b-img-lazy :src="produto.imagemPrincipal" class="rounded mb-4 user-latest-image responsive img-popup product-img" v-if="produto.imagemPrincipal"/>
                            <b-img-lazy :src="require(`@/assets/images/rapidsoft/no-image.jpg`)" class="rounded mb-4 user-latest-image responsive img-popup product-img" v-else />
                        </b-card-text >
                        <b-card-text style="padding:10px">
                            <span class="vx-row" style="font-weight:bold">{{'Ref: ' + produto.referencia}}</span>
                            <span class="vx-row" style="max-width: 15ch; overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">{{produto.nome}}</span>
                        </b-card-text>
                    </vx-card>
                </div>
            </div>
        </template>
        </div>
    </b-modal>
</template>    
<script>

import vSelect from 'vue-select';
import ProdutoDB from '../../rapidsoft/db/produtoDB'
import SegmentoDB from '../../rapidsoft/db/segmentoDB'
import CategoriaDB from '../../rapidsoft/db/categoriaDB'
import Storage from '../../rapidsoft/utils/storage'

export default {
    name: 'search-produto',
    props: {
        id: {
            type: String,
            required: true,            
        }
    },
    data: () => ({
        categoriasFiltro: [],
        segmentosFiltro: [],
        listaProdutosPesquisa: [],
        segmentoSelecionado: null,
        categoriasSelecionadas: null,
        textoSearch: "",
        produtoSearch: null,
    }),
    watch: {
        segmentoSelecionado(newValue, oldValue) {
            if (newValue !== null || oldValue !== null) {
                this.searchCategorias();
            }
        },
        categoriasSelecionadas(newValue, oldValue) {
            if (newValue !== null || oldValue !== null) {
                this.searchFindProduto();
            }
        },
        textoSearch(newValue, oldValue) {
            if ((newValue === "" && oldValue.length > 0) || newValue.length >= 3) {
                this.searchFindProduto();
            }
        }
    },
    components: {
        'v-select': vSelect,
    },
    computed: {
        getSegmentosSearch() {
            return this.segmentosFiltro.map((segmento) => {
                return segmento;
            })
        },
        getCategoriasSearch() {
            return this.categoriasFiltro.map((categoria) => {
                return categoria;
            })
        }
    },
    methods: {
        selectSearchProduto(produto) {
            this.$emit('search-selected', produto);
        },
        searchCategorias() {
            this.categoriasSelecionadas = [];
            CategoriaDB.getAllBySegmento(this.segmentoSelecionado.id).then((categorias) => {
                this.categoriasFiltro = this.lodash.cloneDeep(categorias);
                this.$vs.loading.close('#div-with-loading-search > .con-vs-loading');
            });
        },
        searchFindProduto() {
            if ((this.categoriasSelecionadas && this.categoriasSelecionadas.length > 0) || (this.textoSearch && this.textoSearch.length >= 3)) {
                this.$vs.loading({ container: '#div-with-loading-search', scale: 0.6 });

                const idsCategorias = this.categoriasSelecionadas.map((categoria) => {return categoria.id})
                ProdutoDB.getProdutosSearch(idsCategorias, this.textoSearch).then((result) => {
                    this.listaProdutosPesquisa = result;
                    this.$vs.loading.close('#div-with-loading-search > .con-vs-loading');
                });
            } else {
                this.listaProdutosPesquisa = [];
                this.$vs.loading.close('#div-with-loading-search > .con-vs-loading');
            }
        },
    
    },
    beforeCreate() {              
    },
    created() {
        SegmentoDB._getAll().then((segmentos) => {
            this.segmentosFiltro = this.lodash.cloneDeep(segmentos);
            this.segmentoSelecionado = segmentos.find((segmento) => { return segmento.id === Storage.getCatalogo().idSegmento });
        });
    },
    mounted() {
    },
}
</script>    

<style lang="scss">

.modal {    
    position: fixed;
    z-index: 42000;
}

.modal-dialog {
    max-width: 1024px;
    width: 97% !important;
    margin: 0.2rem 40.0rem;
}

.modal-content {
    height: 98.5vh !important;
    width: 70rem !important;
}

.img-popup {
    max-height: 7rem;
    max-width: 4rem;
}

.popup-produto-search .vs-popup {
    // right: 0;
    height: 100%;
    // width: 60%;        
}

.popup-produto-search .vs-table--search  {
    justify-content: center;
    max-width: 100%;
    position: relative;
    margin-left: auto;

    .input-search {
        width: 100vw;
    }
}

.vs-con-loading-search .vs-loading {
    position: fixed;
    width: 55px;
    height: 55px;
    display: block;
    border-radius: 50%;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    border: 3px solid transparent;
    top: 5% !important;
}

@media only screen and (max-width: 1370px) {

    .modal-dialog {
        margin: 0.2rem 30.0rem;
    }

    .modal-content {
        height: 98.5vh !important;
        width: 54rem !important;
    }

    .vs-table--content{
        max-height: 66vh;
    }
}

@media only screen and (max-width: 1200px) {

    .modal-dialog {
        margin: 0.2rem 10.0rem;
    }

    .modal-content {
        height: 98.5vh !important;
        width: 54rem !important;
    }

    .vs-table--content{
        max-height: 69vh;
    }
}

@media only screen and (max-width: 768px) {

    .modal-dialog {
        margin: 0.2rem 0.5rem;
    }

    .modal-content {
        height: 98.5vh !important;
        width: 54rem !important;
    }

    .vs-table--content{
        max-height: 75vh;
    }
}
    
</style>