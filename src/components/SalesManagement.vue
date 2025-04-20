<template>
  <div class="sales-management">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><Histogram /></el-icon>
            <span class="header-title">销售管理</span>
          </div>
          <el-button type="primary" class="add-button" @click="showAddDialog">
            <el-icon class="el-icon--left"><Plus /></el-icon>
            添加销售记录
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="型号" class="search-item">
            <el-input
              v-model="searchForm.model"
              placeholder="请输入手机型号"
              clearable
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="日期范围" class="search-item">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="date-picker"
            />
          </el-form-item>
          <el-form-item class="search-item">
            <el-button type="primary" class="search-button" @click="handleSearch">
              <el-icon class="el-icon--left"><Search /></el-icon>
              搜索
            </el-button>
            <el-button class="reset-button" @click="resetSearch">
              <el-icon class="el-icon--left"><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table
        :data="getFilteredTableData()"
        border
        style="width: 100%"
        v-loading="loading"
        class="data-table"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="model" label="型号" min-width="180">
          <template #default="{ row }">
            <div class="model-cell">
              <el-icon><Box /></el-icon>
              <span>{{ row.model }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success" effect="dark">{{ row.quantity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期" min-width="180" align="center">
          <template #default="{ row }">
            <div class="date-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(row.date) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="180" align="center">
          <template #default="{ row }">
            <div class="date-cell">
              <el-icon><Timer /></el-icon>
              <span>{{ formatDateTime(row.created_at) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button-group class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalItems"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '添加销售记录' : '编辑销售记录'"
      v-model="dialogVisible"
      width="500px"
      class="dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="dialog-form"
      >
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" class="dialog-input">
            <template #prefix>
              <el-icon><Box /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number 
            v-model="form.quantity" 
            :min="1" 
            class="dialog-input-number"
          />
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="datetime"
            placeholder="选择日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="dialog-date-picker"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="cancel-button" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="submit-button" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { salesApi } from '@/utils/service'
import {
  Histogram,
  Plus,
  Search,
  Refresh,
  Box,
  Calendar,
  Timer,
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 基础状态
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

// 表单模型
const form = ref({
  id: null,
  model: '',
  quantity: 1,
  date: dayjs().format('YYYY-MM-DD HH:mm:ss')
})

const searchForm = ref({
  model: '',
  dateRange: []
})

// 表单验证规则
const rules = {
  model: [
    { required: true, message: '请输入型号', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  quantity: [
    { required: true, message: '请输入数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ]
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const data = await salesApi.getAll()
    tableData.value = data || []
    totalItems.value = tableData.value.length
  } catch (error) {
    console.error('获取销售数据失败:', error)
    ElMessage.error('获取销售数据失败')
  } finally {
    loading.value = false
  }
}

// 添加按钮
const showAddDialog = () => {
  dialogType.value = 'add'
  form.value = {
    id: null,
    model: '',
    quantity: 1,
    date: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      type: 'warning'
    })
    await salesApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 保存
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (dialogType.value === 'add') {
        await salesApi.add(form.value)
        ElMessage.success('添加成功')
      } else {
        await salesApi.update(form.value.id, form.value)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      fetchData()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('提交失败')
    }
  })
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const resetSearch = () => {
  searchForm.value = {
    model: '',
    dateRange: []
  }
  currentPage.value = 1
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 方法：获取过滤后的数据
const getFilteredTableData = () => {
  let data = [...tableData.value]

  // 型号过滤
  if (searchForm.value.model) {
    const keyword = searchForm.value.model.toLowerCase()
    data = data.filter(item => item.model.toLowerCase().includes(keyword))
  }

  // 日期范围过滤
  if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
    const [startDate, endDate] = searchForm.value.dateRange
    data = data.filter(item => {
      const itemDate = dayjs(item.date)
      return itemDate.isAfter(dayjs(startDate)) && itemDate.isBefore(dayjs(endDate))
    })
  }

  totalItems.value = data.length
  return data.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
}

// 日期格式化
const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
const formatDateTime = (datetime) => dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style>
.sales-management {
  padding: 20px;
}

.main-card {
  border-radius: 12px;
  border: none;
  background: linear-gradient(145deg, #ffffff, #f5f7fa);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.main-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.add-button {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
}

.search-bar {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.search-item {
  margin-bottom: 0;
}

.search-input {
  width: 200px;
}

.date-picker {
  width: 300px;
}

.search-button, .reset-button {
  padding: 10px 20px;
  border-radius: 8px;
}

.search-button {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  border: none;
}

.reset-button {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
}

.data-table {
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
}

.model-cell, .date-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons .el-button {
  padding: 8px;
  border-radius: 6px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.pagination {
  background: transparent;
}

.dialog {
  border-radius: 12px;
}

.dialog-form {
  padding: 20px;
}

.dialog-input, .dialog-date-picker {
  width: 100%;
}

.dialog-input-number {
  width: 200px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
}

.cancel-button, .submit-button {
  padding: 10px 24px;
  border-radius: 8px;
}

.submit-button {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  border: none;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.el-card__body) {
  padding: 0;
}

:deep(.el-table) {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: #f5f7fa;
  --el-pagination-hover-color: #409eff;
}

:deep(.el-pagination .el-pager li) {
  border-radius: 4px;
  margin: 0 4px;
}

:deep(.el-pagination .el-pager li.active) {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
}
</style>
