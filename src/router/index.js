import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue')
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/user',
    children: [
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/Auth/UserManage.vue')
      },
      {
        path: 'role',
        name: 'RoleManage',
        component: () => import('@/views/Auth/RoleManage.vue')
      },
      {
        path: 'config/system',
        name: 'SystemSetting',
        component: () => import('@/views/Config/SystemSetting.vue')
      },
      {
        path: 'config/threshold',
        name: 'Threshold',
        component: () => import('@/views/Config/Threshold.vue')
      },
      {
        path: 'list/ipWhite',
        name: 'IpWhite',
        component: () => import('@/views/ListManage/IpWhiteList.vue')
      },
      {
        path: 'list/ipBlack',
        name: 'IpBlack',
        component: () => import('@/views/ListManage/IpBlackList.vue')
      },
      {
        path: 'list/domainWhite',
        name: 'DomainWhite',
        component: () => import('@/views/ListManage/DomainWhiteList.vue')
      },
      {
        path: 'list/domainBlack',
        name: 'DomainBlack',
        component: () => import('@/views/ListManage/DomainBlackList.vue')
      },
      {
        path: 'risk/alertRecord',
        name: 'AlertRecord',
        component: () => import('@/views/RiskManage/AlertRecord.vue')
      },
      {
        path: 'risk/blackWhiteList',
        name: 'BlackWhiteList',
        component: () => import('@/views/RiskManage/BlackWhiteList.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!token && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

export default router
