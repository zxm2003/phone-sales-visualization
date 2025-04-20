import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
    baseURL: process.env.VUE_APP_API_URL || 'https://phone-sales-backend.vercel.app',
    timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(
    config => config,
    error => {
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    response => response.data,
    error => {
        console.error('响应错误:', error)
        ElMessage.error(error.response?.data?.error || '请求失败')
        return Promise.reject(error)
    }
)

// 销售相关接口
export const salesApi = {
    // 获取所有销售数据
    getAll() {
        return service.get('/sales')
    },

    // 获取销售统计信息
    getStats() {
        return service.get('/sales/stats')
    },

    // 添加销售记录
    add(data) {
        return service.post('/sales', data)
    },

    // 更新销售记录
    update(id, data) {
        return service.put(`/sales/${id}`, data)
    },

    // 删除单条销售记录
    delete(id) {
        return service.delete(`/sales/${id}`)
    },

    // 批量删除销售记录
    batchDelete(ids) {
        return service.delete('/sales', { data: { ids } })
    },

    // 获取销售趋势数据
    getTrend(days = 30) {
        return service.get('/sales/trend', { params: { days } })
    },

    // 获取销售预测数据
    getForecast(days = 30) {
        return service.get('/sales/forecast', { params: { days } })
    },

    // 导入销售数据
    import: (data) => {
        console.log('service.js - 导入数据:', data)
        return service.post('/sales/import', { data })
    },

    // ✅ 获取导入历史记录
    getImportHistory() {
        return service.get('/sales/import/history')
    },

    // 获取今日销售数据
    getTodaySales(brand) {
        return service.get('/sales/today', { params: { brand } })
    }
}

// 库存页面相关接口
export const inventoryPageApi = {
    // 获取所有库存数据
    getAll() {
        return service.get('/inventoryPage')
    },

    // 添加库存记录
    add(data) {
        return service.post('/inventoryPage', data)
    },

    // 更新库存记录
    update(id, data) {
        return service.put(`/inventoryPage/${id}`, data)
    },

    // 删除库存记录
    delete(id) {
        return service.delete(`/inventoryPage/${id}`)
    },

    // 调整库存
    adjust(id, data) {
        return service.post(`/inventoryPage/${id}/adjust`, data)
    },

    // 获取库存警报数据
    getAlerts(brand) {
        return service.get('/inventoryPage/alerts', { params: { brand } })
    },

    // 导入库存数据
    import(data) {
        return service.post('/inventoryPage/import', { data })
    },

    // 获取导入历史记录
    getImportHistory() {
        return service.get('/inventoryPage/import/history')
    },

    // 获取库存统计数据
    getStockStats() {
        return service.get('/inventoryPage/stats')
    }
}

// 数据分析相关接口
export const statsApi = {
    // 获取数据分析
    getAnalysis: (params) => {
        return service.get('/sales/analysis', { params })
    },
    
    // 获取今日销售数据
    getTodaySales(brand) {
        return service.get('/sales/today', { params: { brand } })
    },
    
    // 获取昨日销售数据
    getYesterdaySales() {
        return service.get('/sales/yesterday')
    },
    
    // 获取月度销售数据
    getMonthlySales() {
        return service.get('/sales/monthly')
    },

    // 获取销售趋势数据
    getTrend(params) {
        return service.get('/sales/trend', { params })
    },

    // 获取型号销量排行
    getModelRank(params) {
        return service.get('/sales/model-rank', { params })
    },

    // 获取库存分布数据
    getInventoryPage(params) {
        return service.get('/inventoryPage', { params })
    }
}

export default service
