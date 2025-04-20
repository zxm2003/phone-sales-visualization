<template>
  <div v-if="route.path === '/login'">
    <router-view />
  </div>
  <el-container v-else class="app-container">
    <el-aside width="200px">
      <el-menu
        :default-active="route.path"
        class="menu"
        router
      >
        <el-menu-item index="/">
          <el-icon><DataLine /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/sales">
          <el-icon><Histogram /></el-icon>
          <span>销售管理</span>
        </el-menu-item>
        <el-menu-item index="/inventoryPage">
          <el-icon><Box /></el-icon>
          <span>库存管理</span>
        </el-menu-item>
        <el-menu-item index="/import">
          <el-icon><Upload /></el-icon>
          <span>数据导入</span>
        </el-menu-item>
        <el-menu-item index="/dataAnalysis">
          <el-icon><DataLine /></el-icon>
          <span>数据分析</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人信息</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h2>手机销售数据可视化系统</h2>
          <div class="header-right">
            <el-dropdown>
              <el-button type="primary">
                <el-icon class="el-icon--left"><Setting /></el-icon>
                系统设置
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="refreshData">刷新数据</el-dropdown-item>
                  <el-dropdown-item divided @click="clearCache">清除缓存</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataLine,
  Histogram,
  Box,
  Upload,
  Setting,
  User
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const refreshData = () => {
  window.location.reload()
}

const clearCache = () => {
  localStorage.clear()
  ElMessage.success('缓存已清除')
  window.location.reload()
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('isLoggedIn')
  router.push('/login')
  ElMessage.success('已退出登录')
}
</script>

<style>
.app-container {
  height: 100vh;
}

.menu {
  height: 100%;
  background: #ffffff;
  border: none;
  padding: 20px 0;
  position: relative;
  overflow: hidden;
  box-shadow: 4px 0 25px rgba(0, 0, 0, 0.1);
}

.menu::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 0% 0%, rgba(64, 158, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(103, 194, 58, 0.15) 0%, transparent 50%);
  pointer-events: none;
  opacity: 0.5;
}

:deep(.el-menu) {
  border: none;
  background: transparent;
}

:deep(.el-menu-item) {
  height: 56px;
  line-height: 56px;
  margin: 8px 16px;
  border-radius: 12px;
  color: #606266;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

:deep(.el-menu-item)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  transform: translateX(-100%);
  transition: transform 0.6s;
}

:deep(.el-menu-item:hover)::before {
  transform: translateX(100%);
}

:deep(.el-menu-item:hover) {
  background: rgba(66, 153, 225, 0.08);
  color: #4299e1;
}

:deep(.el-menu-item.is-active) {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
  border-color: rgba(66, 153, 225, 0.2);
}

:deep(.el-menu-item .el-icon) {
  color: #606266;
  font-size: 18px;
  margin-right: 4px;
  transition: all 0.3s;
}

:deep(.el-menu-item:hover .el-icon),
:deep(.el-menu-item.is-active .el-icon) {
  color: #4299e1;
}

:deep(.el-menu-item span) {
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s;
}

@keyframes menuItemAppear {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.el-menu-item) {
  animation: menuItemAppear 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

:deep(.el-menu-item:nth-child(1)) { animation-delay: 0.1s; }
:deep(.el-menu-item:nth-child(2)) { animation-delay: 0.2s; }
:deep(.el-menu-item:nth-child(3)) { animation-delay: 0.3s; }
:deep(.el-menu-item:nth-child(4)) { animation-delay: 0.4s; }
:deep(.el-menu-item:nth-child(5)) { animation-delay: 0.5s; }
:deep(.el-menu-item:nth-child(6)) { animation-delay: 0.6s; }

.el-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 0 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(120deg, #2c5282, #4299e1, #63b3ed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: shine 3s linear infinite;
  position: relative;
  padding: 5px 0;
}

.header-content h2::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%,
    #4299e1 50%,
    transparent 100%
  );
  transform: scaleX(0.8);
  opacity: 0.5;
  animation: glow 2s ease-in-out infinite;
}

@keyframes shine {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

@keyframes glow {
  0%, 100% { 
    opacity: 0.5;
    transform: scaleX(0.8);
  }
  50% { 
    opacity: 1;
    transform: scaleX(1);
  }
}

.header-right {
  display: flex;
  align-items: center;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #4299e1, #63b3ed);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 153, 225, 0.3);
  background: linear-gradient(135deg, #3182ce, #4299e1);
}

:deep(.el-button--primary .el-icon) {
  transition: transform 0.3s ease;
}

:deep(.el-button--primary:hover .el-icon) {
  transform: rotate(180deg);
}

.el-main {
  background-color: #f5f7fa;
  padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>