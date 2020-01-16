/*=========================================================================================
  File Name: rapidSoftFilter.js
  Description: Filtros usados no app
==========================================================================================*/

import Vue from 'vue';
import moment from 'moment';


Vue.filter('formatDateTime', (value) => {
    if (value) {
        return moment(new Date(value)).format('DD/MM/YYYY hh:mm');
    }
});

Vue.filter('formatDate', (value) => {
    if (value) {
        return moment(new Date(value)).format('DD/MM/YYYY');
    } 
});

Vue.filter('cpfCnpj', (value) => {
    if (value) {
        value = (typeof value != 'string' ? value.toString() : value);
        value = value.replace(/[^a-z0-9]/gi, "");
        if (value.length === 14) {
            value = value.padStart(14, '0');
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        } else {
            value = value.padStart(11, '0');
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return value;
    } 
});

Vue.filter('capitalize', (value) => {
    if (value) {
        const capitalize = ((word) => word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word);
        return value.toLowerCase().split(' ').map(word => capitalize(word)).join(' ');
    } 
});
