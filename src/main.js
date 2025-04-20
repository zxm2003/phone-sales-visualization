import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 忽略 ResizeObserver 的错误（推荐方式）
window.addEventListener('error', (e) => {
    if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        e.stopImmediatePropagation()
    }
})

// 另一种兼容方式（确保不会弹红色报错框）
const originalError = window.onerror
window.onerror = function (message, source, lineno, colno, error) {
    if (message?.toString?.().includes('ResizeObserver loop completed')) {
        return true // 阻止冒泡
    }
    return originalError?.(message, source, lineno, colno, error)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')
