<template>
  <div class="inventory-page">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><Box /></el-icon>
            <span class="header-title">库存管理</span>
          </div>
          <el-button type="primary" class="add-button" @click="showAddDialog">
            <el-icon class="el-icon--left"><Plus /></el-icon>
            添加库存
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
          <el-form-item label="库存状态" class="search-item">
            <el-select 
              v-model="searchForm.status" 
              placeholder="请选择" 
              clearable
              class="status-select"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
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
        :data="paginatedData"
        border
        style="width: 100%"
        v-loading="loading"
        class="data-table"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="model" label="型号" min-width="120">
          <template #default="{ row }">
            <div class="model-cell">
              <el-icon><Box /></el-icon>
              <span>{{ row.model }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="当前库存" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getQuantityTagType(row)" effect="dark">
              {{ row.quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warning_threshold" label="警告阈值" width="100" align="center">
          <template #default="{ row }">
            <span class="threshold-value">{{ row.warning_threshold }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="min_threshold" label="最小阈值" width="100" align="center">
          <template #default="{ row }">
            <span class="threshold-value">{{ row.min_threshold }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)" class="status-tag" effect="light">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期时间" width="160" align="center">
          <template #default="{ row }">
            <div class="date-cell">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDateTime(row.date) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="160" align="center">
          <template #default="{ row }">
            <div class="date-cell">
              <el-icon><Timer /></el-icon>
              <span>{{ formatDateTime(row.updated_at) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button-group class="action-group">
              <el-button type="primary" size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="success" size="small" @click="showAdjustDialog(row)">
                <el-icon><SetUp /></el-icon>
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
          v-model="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredTableData.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog 
      :title="dialogType === 'add' ? '添加库存' : '编辑库存'" 
      v-model="dialogVisible" 
      width="500px"
      destroy-on-close
      class="dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="dialog-form">
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" :disabled="dialogType === 'edit'" class="dialog-input">
            <template #prefix>
              <el-icon><Box /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="当前库存" prop="quantity">
          <el-input-number v-model="form.quantity" :min="0" class="dialog-input-number" />
        </el-form-item>
        <el-form-item label="警告阈值" prop="warning_threshold">
          <el-input-number v-model="form.warning_threshold" :min="0" class="dialog-input-number" />
        </el-form-item>
        <el-form-item label="最小阈值" prop="min_threshold">
          <el-input-number v-model="form.min_threshold" :min="0" class="dialog-input-number" />
        </el-form-item>
        <el-form-item label="日期时间" prop="date">
          <el-date-picker
            v-model="form.date"
            type="datetime"
            placeholder="选择日期时间"
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

    <!-- 调整库存对话框 -->
    <el-dialog 
      title="调整库存" 
      v-model="adjustDialogVisible" 
      width="400px"
      destroy-on-close
      class="dialog"
    >
      <el-form ref="adjustFormRef" :model="adjustForm" :rules="adjustRules" label-width="120px" class="dialog-form">
        <el-form-item label="型号">
          <span class="info-text">{{ adjustForm.model }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span class="info-text">{{ adjustForm.currentQuantity }}</span>
        </el-form-item>
        <el-form-item label="调整数量" prop="adjustQuantity">
          <el-input-number 
            v-model="adjustForm.adjustQuantity" 
            :min="-adjustForm.currentQuantity" 
            placeholder="正数增加/负数减少"
            class="dialog-input-number"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="adjustForm.remark" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入调整原因"
            resize="none"
            class="dialog-textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button class="cancel-button" @click="adjustDialogVisible = false">取消</el-button>
          <el-button type="primary" class="submit-button" @click="handleAdjustSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { inventoryPageApi } from '@/utils/service'
import {
  Box,
  Plus,
  Search,
  Refresh,
  Calendar,
  Timer,
  Edit,
  Delete,
  SetUp
} from '@element-plus/icons-vue'

// 状态数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const adjustDialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const adjustFormRef = ref(null)

// 状态选项
const statusOptions = [
  { label: '充足', value: 'normal' },
  { label: '警告', value: 'warning' },
  { label: '紧缺', value: 'danger' }
]

const form = ref({
  model: '',
  quantity: 0,
  warning_threshold: 15,
  min_threshold: 8,
  date: dayjs().format('YYYY-MM-DD HH:mm:ss')
})

const adjustForm = ref({
  id: null,
  model: '',
  currentQuantity: 0,
  adjustQuantity: 0,
  remark: ''
})

const searchForm = ref({
  model: '',
  status: ''
})

// 表单验证规则
const rules = {
  model: [{ required: true, message: '请输入型号', trigger: 'blur' }],
  quantity: [{ required: true, type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }],
  warning_threshold: [
    { required: true, type: 'number', min: 0, message: '警告阈值不能小于0', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value <= form.value.min_threshold) {
        callback(new Error('警告阈值必须大于最小阈值'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  min_threshold: [
    { required: true, type: 'number', min: 0, message: '最小阈值不能小于0', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value >= form.value.warning_threshold) {
        callback(new Error('最小阈值必须小于警告阈值'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择日期时间', trigger: 'change' }
  ]
}

const adjustRules = {
  adjustQuantity: [
    { required: true, message: '请输入调整数量', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value + adjustForm.value.currentQuantity < 0) {
        callback(new Error('调整后的库存不能小于0'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  remark: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

// 工具函数
const formatDateTime = (datetime) => dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')

const getStatus = (row) => {
  if (!row || row.quantity === undefined || row.min_threshold === undefined || row.warning_threshold === undefined) {
    return 'normal';
  }
  if (row.quantity <= row.min_threshold) return 'danger';
  if (row.quantity <= row.warning_threshold) return 'warning';
  return 'normal';
}

const getStatusType = (row) => {
  const status = getStatus(row);
  return {
    normal: 'success',
    warning: 'warning',
    danger: 'danger'
  }[status] || 'info';
}

const getStatusText = (row) => {
  const status = getStatus(row);
  return {
    normal: '充足',
    warning: '警告',
    danger: '紧缺'
  }[status] || '未知';
}

const getQuantityTagType = (row) => {
  const status = getStatus(row);
  return {
    normal: 'success',
    warning: 'warning',
    danger: 'danger'
  }[status] || 'info';
}

// 搜索 & 分页处理
const filteredTableData = computed(() => {
  let data = tableData.value
  if (searchForm.value.model) {
    const keyword = searchForm.value.model.toLowerCase()
    data = data.filter(item => item.model.toLowerCase().includes(keyword))
  }
  if (searchForm.value.status) {
    data = data.filter(item => getStatus(item) === searchForm.value.status)
  }
  return data
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = currentPage.value * pageSize.value
  return filteredTableData.value.slice(start, end)
})

// 操作逻辑
const fetchData = async () => {
  loading.value = true
  try {
    const data = await inventoryPageApi.getAll()
    tableData.value = data
  } catch (error) {
    console.error('获取库存数据失败:', error)
    ElMessage.error('获取库存数据失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  dialogType.value = 'add'
  form.value = { model: '', quantity: 0, warning_threshold: 15, min_threshold: 8, date: dayjs().format('YYYY-MM-DD HH:mm:ss') }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
}

const showAdjustDialog = (row) => {
  adjustForm.value = {
    id: row.id,
    model: row.model,
    currentQuantity: row.quantity,
    adjustQuantity: 0,
    remark: ''
  }
  adjustDialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除型号为 ${row.model} 的库存记录吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await inventoryPageApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData() // 刷新数据
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (dialogType.value === 'add') {
        await inventoryPageApi.add(form.value)
        ElMessage.success('添加成功')
      } else {
        await inventoryPageApi.update(form.value.id, form.value)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      fetchData() // 刷新数据
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('提交失败：' + (error.message || '未知错误'))
    }
  })
}

const handleAdjustSubmit = async () => {
  await adjustFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await inventoryPageApi.adjust(adjustForm.value.id, {
        quantity: adjustForm.value.adjustQuantity,
        remark: adjustForm.value.remark
      })
      ElMessage.success('库存调整成功')
      adjustDialogVisible.value = false
      fetchData() // 刷新数据
    } catch (error) {
      console.error('调整库存失败:', error)
      ElMessage.error('调整库存失败：' + (error.message || '未知错误'))
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1 // 重置页码
}

const resetSearch = () => {
  searchForm.value = {
    model: '',
    status: ''
  }
  currentPage.value = 1 // 重置页码
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 重置页码
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style>
.inventory-page {
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

.search-input, .status-select {
  width: 200px;
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

.threshold-value {
  font-weight: 500;
  color: #606266;
}

.status-tag {
  font-weight: 500;
}

.action-group {
  display: flex;
  gap: 8px;
}

.action-group .el-button {
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

.dialog-textarea {
  width: 100%;
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

.info-text {
  color: #606266;
  font-weight: 500;
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
