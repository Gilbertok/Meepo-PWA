/*=========================================================================================
  File Name: router.js
  Description: Routes for vue-router. Lazy loading is enabled.
  Object Strucutre:
                    path => router path
                    name => router name
                    component(lazy loading) => component to load
                    meta : {
                      rule => which user can have access (ACL)
                      breadcrumb => Add breadcrumb to specific page
                      pageTitle => Display title besides breadcrumb
                    }
  ----------------------------------------------------------------------------------------
  Item Name: Vuesax Admin - VueJS Dashboard Admin Template
  Author: Pixinvent
  Author URL: http://www.themeforest.net/user/pixinvent
==========================================================================================*/


import Vue from 'vue'
import Router from 'vue-router'
import auth from "@/auth/authService";

import firebase from 'firebase/app'
import 'firebase/auth'

Vue.use(Router)

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    scrollBehavior () {
        return { x: 0, y: 0 }
    },
    routes: [

		{
		// =============================================================================
		// MAIN LAYOUT ROUTES
		// =============================================================================
			path: '',
			component: () => import('./layouts/main/Main.vue'),
			children: [
		// =============================================================================
		// Theme Routes
		// =============================================================================
				{
					path: '/',
					name: 'home',
					component: () => import('./views/Home.vue'),
					meta: {
              rule: 'editor'
          }
				},
				{
					path: '/cliente/cadastro',
					name: 'Cadastro de Cliente',
					component: () => import('./views/pages/ClienteCadastro.vue'),
					meta: {
              rule: 'editor'
          }
        },
			],
		},
    // =============================================================================
    // FULL PAGE LAYOUTS
    // =============================================================================
      {
        path: '',
        component: () => import('@/layouts/full-page/FullPage.vue'),
        children: [
      // =============================================================================
      // PAGES
      // =============================================================================
			{
				path: '/pages/login',
				name: 'pageLogin',
				component: () => import('@/views/pages/Login.vue'),
				meta: {
					rule: 'editor'
				}
			},
			{
				path: '/pages/error-404',
				name: 'pageError404',
				component: () => import('@/views/pages/Error404.vue'),
				meta: {
					rule: 'editor'
				}
			},
        ]
      },
      // Redirect to 404 page, if no match found
      {
        path: '*',
        redirect: '/pages/error-404'
      }
    ],
})

router.afterEach(() => {
  // Remove initial loading
  const appLoading = document.getElementById('loading-bg')
    if (appLoading) {
        appLoading.style.display = "none";
    }
})

router.beforeEach((to, from, next) => {
  firebase.auth().onAuthStateChanged(() => {

      // get firebase current user
      const firebaseCurrentUser = firebase.auth().currentUser;

      if (to.path === "/pages/login" ||
          to.path === "/pages/forgot-password" ||
          to.path === "/pages/error-404" ||
          to.path === "/pages/error-500" ||
          to.path === "/pages/register" ||
          to.path === "/callback" ||
          to.path === "/pages/comingsoon" ||
          (auth.isAuthenticated() || firebaseCurrentUser)) {
          return next();
      }

      router.push({ path: '/pages/login', query: { to: to.path } })
      // Specify the current path as the customState parameter, meaning it
      // will be returned to the application after auth
      // auth.login({ target: to.path });

  });

});

export default router
