<template>
  <div class="profile-container" v-if="mounted">
    <el-card class="profile-card">
      <div class="card-header">
        <div class="header-left">
          <el-icon class="header-icon"><User /></el-icon>
          <h2 class="title">个人资料</h2>
        </div>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
      
      <div class="profile-content">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <el-avatar
              :size="120"
              :src="userInfo.avatar"
              class="user-avatar"
            />
            <div class="avatar-actions">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
              >
                <el-button type="primary" plain>
                  <el-icon><Upload /></el-icon>
                  更换头像
                </el-button>
              </el-upload>
              <el-button @click="resetAvatar">
                <el-icon><Delete /></el-icon>
                重置头像
              </el-button>
            </div>
          </div>
          
          <div class="user-basic-info">
            <h3>{{ userInfo.username }}</h3>
            <el-tag :type="userRoleType" class="user-role">
              {{ userInfo.role }}
            </el-tag>
            <el-tag :type="userStatusType" class="user-status">
              {{ userInfo.status }}
            </el-tag>
          </div>
        </div>

        <el-form
          ref="profileForm"
          :model="userInfo"
          :rules="rules"
          label-position="top"
          class="profile-form"
        >
          <el-divider>基本信息</el-divider>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="userInfo.username" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="userInfo.email" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="userInfo.phone" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="部门" prop="department">
                <el-input v-model="userInfo.department" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider>密码设置</el-divider>

          <el-form-item label="当前密码" prop="currentPassword">
            <el-input
              v-model="userInfo.currentPassword"
              type="password"
              show-password
            />
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="userInfo.newPassword"
              type="password"
              show-password
            />
            <div class="password-strength" :class="passwordStrengthClass">
              {{ passwordStrengthText }}
            </div>
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="userInfo.confirmPassword"
              type="password"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="updateProfile">
              保存更改
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Upload,
  Refresh,
  Delete
} from '@element-plus/icons-vue'
import axios from 'axios'

const mounted = ref(false)
const username = localStorage.getItem('username')
const avatarUrl = ref('')
const loading = ref(false)
const userInfo = ref({
  username: username,
  email: '',
  phone: '',
  createTime: '',
  lastLogin: '',
  lastLoginIp: '',
  loginCount: 0,
  role: '',
  status: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  theme: 'light',
  notification: true,
  avatar: '',
  department: ''
})

// 计算用户角色标签类型
const userRoleType = computed(() => {
  const role = userInfo.value.role?.toLowerCase()
  switch (role) {
    case 'admin': return 'danger'
    case 'manager': return 'warning'
    case 'user': return 'success'
    default: return 'info'
  }
})

// 计算用户状态标签类型
const userStatusType = computed(() => {
  const status = userInfo.value.status?.toLowerCase()
  switch (status) {
    case '正常': return 'success'
    case '禁用': return 'danger'
    case '锁定': return 'warning'
    default: return 'info'
  }
})

// 计算密码强度
const passwordStrength = computed(() => {
  const password = userInfo.value.newPassword
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength += 25
  if (/[A-Z]/.test(password)) strength += 25
  if (/[0-9]/.test(password)) strength += 25
  if (/[^A-Za-z0-9]/.test(password)) strength += 25
  
  return strength
})

// 计算密码强度文本
const passwordStrengthText = computed(() => {
  if (!userInfo.value.newPassword) return '无'
  if (passwordStrength.value >= 75) return '强'
  if (passwordStrength.value >= 50) return '中'
  if (passwordStrength.value >= 25) return '弱'
  return '无'
})

// 计算密码强度样式类
const passwordStrengthClass = computed(() => {
  if (!userInfo.value.newPassword) return ''
  if (passwordStrength.value >= 75) return 'strong'
  if (passwordStrength.value >= 50) return 'medium'
  if (passwordStrength.value >= 25) return 'weak'
  return ''
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/user/profile', {
      headers: {
        'x-username': username
      }
    })
    if (response.data.success) {
      const data = response.data.data
      userInfo.value = {
        ...userInfo.value,
        email: data.email,
        phone: data.phone,
        createTime: data.createTime,
        lastLogin: data.lastLogin,
        lastLoginIp: data.lastLoginIp,
        loginCount: data.loginCount,
        role: data.role,
        status: data.status,
        theme: data.theme || 'light',
        notification: data.notification !== false,
        avatar: data.avatar,
        department: data.department
      }
      if (data.avatar) {
        avatarUrl.value = data.avatar
      }
    } else {
      ElMessage.error(response.data.message || '获取用户信息失败')
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

// 刷新数据
const refreshData = () => {
  fetchUserInfo()
  ElMessage.success('数据已刷新')
}

// 更新个人信息
const updateProfile = async () => {
  if (userInfo.value.newPassword) {
    if (!userInfo.value.currentPassword) {
      ElMessage.error('请输入原密码')
      return
    }
    if (userInfo.value.newPassword !== userInfo.value.confirmPassword) {
      ElMessage.error('两次输入的密码不一致')
      return
    }
  }

  loading.value = true
  try {
    const response = await axios.post('http://localhost:3000/api/user/update', {
      email: userInfo.value.email,
      phone: userInfo.value.phone,
      oldPassword: userInfo.value.currentPassword,
      newPassword: userInfo.value.newPassword,
      theme: userInfo.value.theme,
      notification: userInfo.value.notification,
      department: userInfo.value.department
    }, {
      headers: {
        'x-username': username
      }
    })

    if (response.data.success) {
      ElMessage.success('更新成功')
      resetForm()
    } else {
      ElMessage.error(response.data.message || '更新失败')
    }
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  userInfo.value.currentPassword = ''
  userInfo.value.newPassword = ''
  userInfo.value.confirmPassword = ''
}

// 重置头像
const resetAvatar = () => {
  avatarUrl.value = ''
  ElMessage.success('头像已重置')
}

// 头像上传相关
const handleAvatarSuccess = (response) => {
  if (response.success) {
    avatarUrl.value = response.url
    ElMessage.success('头像更新成功')
  } else {
    ElMessage.error(response.message || '头像更新失败')
  }
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传头像图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

// 组件挂载后初始化
onMounted(async () => {
  try {
    await fetchUserInfo()
    mounted.value = true
  } catch (error) {
    console.error('初始化失败:', error)
  }
})
</script>

<style scoped>
.profile-container {
  padding: 24px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f8faff 0%, #eef2f8 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.profile-card {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: none;
}

.card-header {
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 24px;
  color: #4299e1;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.profile-content {
  padding: 30px;
}

.avatar-section {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-basic-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}

.user-basic-info h3 {
  font-size: 24px;
  margin: 0;
  color: #2c3e50;
}

.user-role, .user-status {
  margin: 5px 0;
  font-weight: 500;
}

.profile-form {
  max-width: 800px;
  margin: 0 auto;
}

:deep(.el-form-item) {
  margin-bottom: 25px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #4a5568;
}

:deep(.el-input__wrapper) {
  padding: 8px 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

:deep(.el-input__inner) {
  height: 42px;
}

:deep(.el-divider__text) {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  background: linear-gradient(135deg, #4299e1, #63b3ed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(.el-divider) {
  margin: 40px 0;
}

.password-strength {
  margin-top: 8px;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.password-strength.weak {
  background-color: #fff5f5;
  color: #e53e3e;
}

.password-strength.medium {
  background-color: #fffaf0;
  color: #d69e2e;
}

.password-strength.strong {
  background-color: #f0fff4;
  color: #38a169;
}

@media (max-width: 768px) {
  .profile-card {
    width: 95%;
  }
  
  .avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
  }
  
  .profile-form {
    padding: 0 10px;
  }
  
  .el-col {
    width: 100%;
  }
}
</style> 