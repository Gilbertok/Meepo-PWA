/*=========================================================================================
  File Name: getters.js
  Description: Vuex Store - getters
  ----------------------------------------------------------------------------------------
  Item Name: Vuesax Admin - VueJS Dashboard Admin Template
  Author: Pixinvent
  Author URL: http://www.themeforest.net/user/pixinvent
==========================================================================================*/


const getters = {

  isLoggedIn: (state) => !!state.token,
  getUserActive: (state) => state.AppActiveUser,
  getSincDados: (state) => state.sincTotal,
  
};

export default getters;