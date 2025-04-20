import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '../components/DashboardPage.vue'
import SalesManagement from '../components/SalesManagement.vue'
import InventoryPage from '../components/InventoryPage.vue'
import DataImport from '../components/DataImport.vue'
import DataAnalysis from '../components/DataAnalysis.vue'
import LoginPage from '../components/LoginPage.vue'
import UserProfile from '@/components/UserProfile.vue'

const routes = [
    {
        path: '/login',
        name: 'LoginPage',
        component: LoginPage
    },
    {
        path: '/',
        name: 'DashboardPage',
        component: DashboardPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/dataanalysis',
        name: 'DataAnalysis',
        component: DataAnalysis,
        meta: { requiresAuth: true }
    },
    {
        path: '/sales',
        name: 'SalesManagement',
        component: SalesManagement,
        meta: { requiresAuth: true }
    },
    {
        path: '/inventoryPage',
        name: 'InventoryPage',
        component: InventoryPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/import',
        name: 'DataImport',
        component: DataImport,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'UserProfile',
        component: UserProfile,
        meta: {
            requiresAuth: true,
            title: '个人信息'
        }
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    
    if (to.path === '/login') {
        if (token) {
            next('/')
        } else {
            next()
        }
    } else if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!token) {
            next('/login')
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router