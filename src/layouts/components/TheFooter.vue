<!-- =========================================================================================
    File Name: TheFooter.vue
    Description: Footer component
    Component Name: TheFooter
    ----------------------------------------------------------------------------------------
    Item Name: Vuesax Admin - VueJS Dashboard Admin Template
      Author: Pixinvent
    Author URL: http://www.themeforest.net/user/pixinvent
========================================================================================== -->


<template>
    <footer class="the-footer flex-wrap justify-between" :class="classes">
        <span>Desenvolvido por <a href="http://rapidsoft.com.br/" target="_blank" rel="nofollow">RapidSoft</a></span>
        <span class="md:flex hidden items-center">
            <span>V: {{versao}}</span>
        </span>
    </footer>
</template>

<script>

import Config from '../../../public/config.json'

export default {
    name: "the-footer",
    props: {
        classes: {
            type: String,
        },
    },
    data() {
        return {
            versao: Config.versao,
        }
    }
}
</script>
