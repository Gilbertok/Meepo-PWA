/*=========================================================================================
  File Name: sidebarItems.js
  Description: Sidebar Items list. Add / Remove menu items from here.
  Strucutre:
          url     => router path
          name    => name to display in sidebar
          slug    => router path name
          icon    => Feather Icon component/icon name
          tag     => text to display on badge
          tagColor  => class to apply on badge element
          i18n    => Internationalization
          submenu   => submenu of current item (current item will become dropdown )
                NOTE: Submenu don't have any icon(you can add icon if u want to display)
          isDisabled  => disable sidebar item/group
  ----------------------------------------------------------------------------------------
  Item Name: Vuesax Admin - VueJS Dashboard Admin Template
  Author: Pixinvent
  Author URL: http://www.themeforest.net/user/pixinvent
==========================================================================================*/


export default [
  {
    url: "/",
    name: "Início",
    slug: "home",
    icon: "HomeIcon",
  },
  {
    header: "Cliente",
    i18n: "Cliente",
  },
  {
    url: "/cliente/consulta",
    name: "Clientes",
    slug: "Cliente",
    icon: "UsersIcon",
  }, 
  {
    url: "/cliente/cadastro",
    name: "Novo Cliente",
    slug: "Cliente",
    icon: "UserPlusIcon",
  },   
  {
    header: "Pedido",
    i18n: "Pedido",
  },
  {
    url: "/catalogo",
    name: "Catálogo",
    slug: "Catálogo",
    icon: "BookOpenIcon",
  },
  {
    url: "/monteLook",
    name: "Monte o Look",
    slug: "Monte o Look",
    icon: "SlidersIcon",
  },
  {
    url: "/pedido/consulta",
    name: "Pedidos",
    slug: "Pedido",
    icon: "PackageIcon",
  },
  {
    url: "/orcamento/consulta",
    name: "Orçamentos",
    slug: "Orcamento",
    icon: "FileTextIcon",
  },
  {
    header: "Suporte",
    i18n: "Suporte",
  },
  {
    url: "/pages/sincronizacao",
    name: "Sincronizar",
    slug: "Sincronizar",
    icon: "RefreshCcwIcon",
  },
  {
    url: "/pages/suporte/atualizacao",
    name: "Atualização",
    slug: "Atualização",
    icon: "DownloadIcon",
  },
  {
    url: "/pages/suporte/log",
    name: "Logs",
    slug: "Logs",
    icon: "ListIcon",
  },
];