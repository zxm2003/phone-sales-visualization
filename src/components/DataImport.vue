/* eslint-disable no-unused-vars */
<template>
  <div class="data-import">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据导入</span>
          <div class="header-buttons">
            <el-button-group>
              <el-button type="primary" @click="downloadTemplate('sales')">下载销售模板</el-button>
              <el-button type="success" @click="downloadTemplate('inventory')">下载库存模板</el-button>
            </el-button-group>
            <el-button type="primary" @click="triggerFileInput">导入数据</el-button>
          </div>
        </div>
      </template>

      <!-- 上传区域 -->
      <div class="upload-area" v-if="!importData.length" @dragover.prevent @drop.prevent="handleDrop">
        <el-upload
          ref="fileInputRef"
          class="upload-dragger"
          drag
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <div class="el-upload__tip">
            支持 .xlsx, .xls 格式文件，文件大小不超过10MB
          </div>
        </el-upload>
      </div>

      <div class="import-type-select" v-if="!importData.length">
        <el-radio-group v-model="importType">
          <el-radio-button value="sales">销售数据</el-radio-button>
          <el-radio-button value="inventory">库存数据</el-radio-button>
        </el-radio-group>
      </div>

      <div class="upload-area" v-if="!importData.length">
        <el-empty description="暂无导入数据">
          <template #image>
            <el-icon :size="60"><Upload /></el-icon>
          </template>
          <template #description>
            <p>请先下载模板，填写数据后导入</p>
          </template>
        </el-empty>
      </div>

      <!-- 预览表格 -->
      <div v-else class="preview-area">
        <div class="preview-header">
          <h3>数据预览 ({{ importType === 'sales' ? '销售数据' : '库存数据' }})</h3>
          <div class="preview-actions">
            <el-button type="primary" @click="handleImport" :loading="importing">
              确认导入
            </el-button>
            <el-button @click="cancelImport">取消</el-button>
            <el-button type="warning" @click="exportInvalidData" v-if="invalidCount > 0">
              导出无效数据
            </el-button>
          </div>
        </div>

        <el-table
            :data="importData"
            border
            style="width: 100%"
            height="400"
            :max-height="400"
        >
          <el-table-column type="index" label="序号" width="80" fixed />
          <el-table-column prop="model" label="型号" width="180" />
          <el-table-column prop="quantity" label="数量" width="120" />
          <template v-if="importType === 'sales'">
            <el-table-column prop="date" label="日期时间" width="180">
              <template #default="{ row }">
                {{ row.date || '未设置' }}
              </template>
            </el-table-column>
          </template>
          <template v-else>
            <el-table-column prop="warning_threshold" label="警告阈值" width="120" />
            <el-table-column prop="min_threshold" label="最小阈值" width="120" />
          </template>
          <el-table-column prop="validationResult" label="验证结果" width="200">
            <template #default="{ row }">
              <el-tag
                  :type="row.isValid ? 'success' : 'danger'"
                  size="small"
              >
                {{ row.validationMessage || '验证通过' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <!-- 导入结果统计 -->
        <div class="import-stats">
          <el-alert
              :title="`总计 ${importData.length} 条数据，${validCount} 条有效，${invalidCount} 条无效`"
              :type="invalidCount > 0 ? 'warning' : 'success'"
              show-icon
          />
        </div>
      </div>

      <!-- 导入历史记录 -->
      <div class="import-history">
        <h3>导入历史</h3>
        <div class="history-header">
          <el-radio-group v-model="historyType" @change="fetchImportHistory">
            <el-radio-button value="sales">销售记录</el-radio-button>
            <el-radio-button value="inventory">库存记录</el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="fetchImportHistory">刷新</el-button>
        </div>
        <el-table
            :data="historyData"
            border
            style="width: 100%"
            height="400"
            :max-height="400"
        >
          <el-table-column prop="created_at" label="导入时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="filename" label="文件名" width="200" />
          <el-table-column prop="total_count" label="总数量" width="100" />
          <el-table-column prop="success_count" label="成功数" width="100" />
          <el-table-column prop="fail_count" label="失败数" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                {{ row.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
/* eslint-disable no-unused-vars */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, UploadFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { salesApi, inventoryPageApi } from '@/utils/service'

// 数据
const fileInputRef = ref(null)
const importData = ref([])
const importing = ref(false)
const historyData = ref([])
const importType = ref('sales')
const historyType = ref('sales')

// 计算属性
const validCount = computed(() =>
    importData.value.filter(item => item.isValid).length
)

const invalidCount = computed(() =>
    importData.value.filter(item => !item.isValid).length
)

// 方法
const formatDateTime = (datetime) => dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')

const triggerFileInput = () => {
  fileInputRef.value.click()
}

const downloadTemplate = (type) => {
  // 创建模板数据
  let template = []
  if (type === 'sales') {
    template = [
      ['型号', '数量', '日期时间'],
      ['iPhone 14', 10, '2024-03-20 14:30:00'],
      ['Samsung S24', 5, '2024-03-20 15:45:00']
    ]
  } else {
    template = [
      ['型号', '数量', '警告阈值', '最小阈值', '日期时间'],
      ['iPhone 14', 100, 20, 10, '2024-03-20 14:30:00'],
      ['Samsung S24', 80, 15, 8, '2024-03-20 15:45:00']
    ]
  }

  // 创建工作簿和工作表
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(template)

  // 设置列宽
  ws['!cols'] = type === 'sales' 
    ? [{ wch: 20 }, { wch: 10 }, { wch: 20 }]  // 销售数据列宽
    : [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }]  // 库存数据列宽

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, type === 'sales' ? '销售数据模板' : '库存数据模板')

  // 下载文件
  XLSX.writeFile(wb, type === 'sales' ? '销售数据导入模板.xlsx' : '库存数据导入模板.xlsx')
}

const validateRow = (row, index) => {
  const errors = []

  // 验证型号
  if (!row.model) {
    errors.push('型号不能为空')
  } else if (row.model.length > 50) {
    errors.push('型号长度不能超过50个字符')
  }

  // 验证数量
  const quantity = Number(row.quantity)
  if (isNaN(quantity) || quantity <= 0) {
    errors.push('数量必须为大于0的数字')
  }

  if (importType.value === 'sales') {
    // 验证日期时间
    let date = row.date
    if (!date) {
      // 如果没有日期，使用当前时间
      date = dayjs().format('YYYY-MM-DD HH:mm:ss')
      row.date = date
    } else {
      // 尝试多种日期格式解析
      if (typeof date === 'number') {
        // Excel数字日期格式
        const excelDate = new Date((date - 25569) * 86400 * 1000)
        date = dayjs(excelDate).format('YYYY-MM-DD HH:mm:ss')
      } else if (typeof date === 'string') {
        // 尝试多种日期格式
        const formats = [
          'YYYY-MM-DD HH:mm:ss',
          'YYYY-MM-DD',
          'YYYY/MM/DD HH:mm:ss',
          'YYYY/MM/DD',
          'MM/DD/YYYY HH:mm:ss',
          'MM/DD/YYYY'
        ]
        let parsedDate = null
        for (const format of formats) {
          parsedDate = dayjs(date, format)
          if (parsedDate.isValid()) break
        }
        if (parsedDate && parsedDate.isValid()) {
          date = parsedDate.format('YYYY-MM-DD HH:mm:ss')
        } else {
          // 如果无法解析，使用当前时间
          date = dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
      }
      row.date = date
    }
  } else {
    // 验证库存特有字段
    const warning = Number(row.warning_threshold)
    const min = Number(row.min_threshold)
    if (isNaN(warning) || warning <= 0) {
      errors.push('警告阈值必须为大于0的数字')
    }
    if (isNaN(min) || min <= 0) {
      errors.push('最小阈值必须为大于0的数字')
    }
    if (min > warning) {
      errors.push('最小阈值不能大于警告阈值')
    }
  }

  return {
    ...row,
    isValid: errors.length === 0,
    validationMessage: errors.join('；'),
    rowIndex: index + 1
  }
}

const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  // 添加文件类型验证
  const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('文件类型不支持，请上传 .xlsx 或 .xls 格式的文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      
      // 根据导入类型设置表头
      const headers = importType.value === 'sales' 
        ? ['model', 'quantity', 'date']
        : ['model', 'quantity', 'warning_threshold', 'min_threshold']
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: headers,
        raw: false,
        dateNF: 'yyyy-mm-dd hh:mm:ss'
      })

      // 移除表头
      jsonData.shift()

      // 处理数据
      const processedData = jsonData.map(row => {
        if (importType.value === 'sales') {
          // 处理销售数据的日期时间格式和数量
          let date = row.date
          if (!date) {
            // 如果没有日期，使用当前时间
            date = dayjs().format('YYYY-MM-DD HH:mm:ss')
          } else if (typeof date === 'number') {
            // Excel数字日期格式转换
            const excelDate = new Date((date - 25569) * 86400 * 1000)
            date = dayjs(excelDate).format('YYYY-MM-DD HH:mm:ss')
          } else if (typeof date === 'string') {
            // 尝试多种日期格式
            const formats = [
              'YYYY-MM-DD HH:mm:ss',
              'YYYY-MM-DD',
              'YYYY/MM/DD HH:mm:ss',
              'YYYY/MM/DD',
              'MM/DD/YYYY HH:mm:ss',
              'MM/DD/YYYY'
            ]
            let parsedDate = null
            for (const format of formats) {
              parsedDate = dayjs(date, format)
              if (parsedDate.isValid()) break
            }
            date = parsedDate && parsedDate.isValid() 
              ? parsedDate.format('YYYY-MM-DD HH:mm:ss')
              : dayjs().format('YYYY-MM-DD HH:mm:ss')
          }

          return { 
            ...row, 
            date,
            quantity: Number(row.quantity)
          }
        } else {
          // 处理库存数据的数值类型
          return {
            ...row,
            quantity: Number(row.quantity),
            warning_threshold: Number(row.warning_threshold || 15),
            min_threshold: Number(row.min_threshold || 8)
          }
        }
      })

      // 验证数据
      importData.value = processedData.map(validateRow)

      // 重置文件输入
      uploadFile.raw = null
    } catch (error) {
      ElMessage.error('文件解析失败，请确保使用正确的模板格式')
      console.error('文件解析失败:', error)
    }
  }
  reader.readAsArrayBuffer(file)
}

const handleImport = async () => {
  if (invalidCount.value > 0) {
    ElMessage.warning('存在无效数据，请修正后重试')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要导入这些${importType.value === 'sales' ? '销售' : '库存'}数据吗？`, 
      '确认导入', 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (error) {
    return
  }

  importing.value = true
  try {
    // 只保留有效数据，并移除验证相关的字段
    const validData = importData.value
      .filter(item => item.isValid)
      .map(item => {
        const { isValid, validationMessage, rowIndex, ...data } = item
        return data
      })

    if (validData.length === 0) {
      ElMessage.warning('没有有效数据可以导入')
      return
    }

    // 根据导入类型选择不同的API
    const response = importType.value === 'sales'
      ? await salesApi.import(validData)
      : await inventoryPageApi.import(validData)

    ElMessage.success('数据导入成功')
    importData.value = []
    fetchImportHistory()
  } catch (error) {
    console.error('导入失败:', error)
    const errorMessage = error.response?.data?.error || error.message || '未知错误'
    const errorDetails = error.response?.data?.details || []
    
    if (errorDetails.length > 0) {
      // 显示详细的错误信息
      ElMessageBox.alert(
        `导入失败: ${errorMessage}\n\n详细错误:\n${errorDetails.map(detail => 
          `型号: ${detail.model}\n数量: ${detail.quantity}\n日期: ${detail.date}\n错误: ${detail.errors.join(', ')}\n`
        ).join('\n')}`,
        '导入错误',
        {
          confirmButtonText: '确定',
          type: 'error'
        }
      )
    } else {
      ElMessage.error(`数据导入失败: ${errorMessage}`)
    }
  } finally {
    importing.value = false
  }
}

const cancelImport = () => {
  importData.value = []
}

const fetchImportHistory = async () => {
  try {
    const data = historyType.value === 'sales'
      ? await salesApi.getImportHistory()
      : await inventoryPageApi.getImportHistory()
    historyData.value = data
  } catch (error) {
    console.error('获取导入历史失败:', error)
    ElMessage.error('获取导入历史失败')
  }
}

// 添加拖拽处理
const handleDrop = (e) => {
  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFileChange({ raw: files[0] })
  }
}

// 添加导出无效数据功能
const exportInvalidData = () => {
  const invalidData = importData.value.filter(item => !item.isValid)
  if (invalidData.length === 0) {
    ElMessage.warning('没有无效数据可导出')
    return
  }

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(invalidData.map(item => ({
    ...item,
    validationMessage: item.validationMessage || '验证失败'
  })))
  
  XLSX.utils.book_append_sheet(wb, ws, '无效数据')
  XLSX.writeFile(wb, '无效数据导出.xlsx')
  ElMessage.success('无效数据导出成功')
}

// 生命周期钩子
onMounted(() => {
  fetchImportHistory()
})
</script>

<style scoped>
.data-import {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.import-type-select {
  margin: 20px 0;
  text-align: center;
}

.upload-area {
  padding: 40px;
  text-align: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  margin: 20px 0;
}

.preview-area {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.import-stats {
  margin: 20px 0;
}

.import-history {
  margin-top: 40px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
}
</style>