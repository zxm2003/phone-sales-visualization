<template>
  <div class="login-container">
    <div class="login-box">
      <h2>手机销售数据可视化系统</h2>
      <div class="input-group">
        <input type="text" v-model="username" placeholder="用户名" />
      </div>
      <div class="input-group">
        <input type="password" v-model="password" placeholder="密码" />
      </div>
      <button @click="handleLogin" class="login-button">登录</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
    }
  },
  methods: {
    handleLogin() {
      // 直接登录，不需要验证
      localStorage.setItem('token', 'dummy-token');
      localStorage.setItem('username', this.username || 'admin');
      this.$router.push('/dashboard');
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.login-button {
  width: 100%;
  padding: 0.8rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.login-button:hover {
  background: #764ba2;
}
</style> 