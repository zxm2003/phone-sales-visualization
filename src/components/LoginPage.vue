<template>
  <div class="login-container">
    <div class="login-box" :class="{ 'login-box-register': !isLogin }">
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-circle"></div>
          <div class="logo-circle"></div>
          <div class="logo-circle"></div>
        </div>
        <h2 class="title">手机销售可视化系统</h2>
        <p class="subtitle">{{ isLogin ? '欢迎回来，请登录您的账号' : '创建新账号' }}</p>
      </div>
      
      <div class="login-form">
        <div v-if="errorMessage" class="error-message" :class="{ 'error-shake': errorMessage }">
          <i class="el-icon-warning"></i>
          {{ errorMessage }}
        </div>
        <div class="form-item" :class="{ 'form-item-error': errorMessage && !username }">
          <div class="input-icon">
            <i class="el-icon-user"></i>
          </div>
          <input 
            type="text" 
            v-model="username" 
            placeholder="用户名" 
            @focus="handleFocus('username')"
            @blur="handleBlur('username')"
            :class="{ 'focused': focusedInput === 'username' }"
            :disabled="loading"
          />
        </div>
        <div class="form-item" :class="{ 'form-item-error': errorMessage && !password }">
          <div class="input-icon">
            <i class="el-icon-lock"></i>
          </div>
          <input 
            :type="showPassword ? 'text' : 'password'"
            v-model="password" 
            placeholder="密码" 
            @focus="handleFocus('password')"
            @blur="handleBlur('password')"
            :class="{ 'focused': focusedInput === 'password' }"
            :disabled="loading"
          />
          <div class="password-toggle" @click="showPassword = !showPassword">
            <i :class="showPassword ? 'el-icon-view' : 'el-icon-hide'"></i>
          </div>
        </div>
        <div class="form-item" v-if="!isLogin" :class="{ 'form-item-error': errorMessage && !confirmPassword }">
          <div class="input-icon">
            <i class="el-icon-lock"></i>
          </div>
          <input 
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="confirmPassword" 
            placeholder="确认密码" 
            @focus="handleFocus('confirmPassword')"
            @blur="handleBlur('confirmPassword')"
            :class="{ 'focused': focusedInput === 'confirmPassword' }"
            :disabled="loading"
          />
          <div class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
            <i :class="showConfirmPassword ? 'el-icon-view' : 'el-icon-hide'"></i>
          </div>
        </div>
        <div v-if="!isLogin" class="password-strength">
          <div class="strength-bar" :class="passwordStrengthClass">
            <div class="strength-segment"></div>
            <div class="strength-segment"></div>
            <div class="strength-segment"></div>
          </div>
          <span class="strength-text">{{ passwordStrengthText }}</span>
        </div>
        <div class="form-item" v-if="isLogin">
          <div class="captcha-container">
            <input 
              type="text" 
              v-model="captcha" 
              placeholder="验证码" 
              @focus="handleFocus('captcha')"
              @blur="handleBlur('captcha')"
              :class="{ 'focused': focusedInput === 'captcha' }"
              :disabled="loading"
            />
            <div class="captcha-image" @click="refreshCaptcha">
              <img :src="captchaImage" alt="验证码" v-if="captchaImage" />
              <div v-else class="captcha-loading"></div>
            </div>
          </div>
        </div>
        <div class="form-options" v-if="isLogin">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberAccount" />
            <span>记住账号</span>
          </label>
          <span class="forgot-password" @click="handleForgotPassword">忘记密码？</span>
        </div>
        <div class="form-item">
          <button @click="handleSubmit" class="login-button" :class="{ 'loading': loading }" :disabled="loading">
            <span>{{ isLogin ? '登录' : '注册' }}</span>
            <div class="button-effect"></div>
            <div class="loading-spinner" v-if="loading"></div>
          </button>
        </div>
        <div class="social-login" v-if="isLogin">
          <div class="social-divider">
            <span>其他登录方式</span>
          </div>
          <div class="social-buttons">
            <button class="social-button wechat" @click="handleWechatLogin">
              <i class="el-icon-chat-dot-round"></i>
            </button>
            <button class="social-button qq" @click="handleQQLogin">
              <i class="el-icon-connection"></i>
            </button>
          </div>
        </div>
        <div class="switch-form">
          <span @click="toggleForm" :class="{ 'switch-hover': !loading }">
            {{ isLogin ? '没有账号？立即注册' : '已有账号？立即登录' }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="background-animation">
      <div class="circle"></div>
      <div class="circle"></div>
      <div class="circle"></div>
      <div class="circle"></div>
      <div class="circle"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      confirmPassword: '',
      captcha: '',
      captchaImage: '',
      captchaId: '',
      focusedInput: null,
      isLogin: true,
      loading: false,
      errorMessage: '',
      showPassword: false,
      showConfirmPassword: false,
      rememberAccount: false
    }
  },
  computed: {
    passwordStrength() {
      if (!this.password) return 0
      let strength = 0
      if (this.password.length >= 8) strength++
      if (/[A-Z]/.test(this.password)) strength++
      if (/[0-9]/.test(this.password)) strength++
      if (/[^A-Za-z0-9]/.test(this.password)) strength++
      return strength
    },
    passwordStrengthClass() {
      return {
        'strength-weak': this.passwordStrength <= 1,
        'strength-medium': this.passwordStrength === 2,
        'strength-strong': this.passwordStrength >= 3
      }
    },
    passwordStrengthText() {
      if (!this.password) return ''
      switch (this.passwordStrength) {
        case 1: return '弱'
        case 2: return '中'
        case 3: return '强'
        case 4: return '很强'
        default: return ''
      }
    }
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = '';
      this.loading = true;

      try {
        if (!this.username || !this.password) {
          this.errorMessage = '请填写完整信息';
          return;
        }

        if (!this.isLogin) {
          if (this.password !== this.confirmPassword) {
            this.errorMessage = '两次输入的密码不一致';
            return;
          }
          if (this.passwordStrength < 2) {
            this.errorMessage = '密码强度不足，请使用更复杂的密码';
            return;
          }
        }

        if (this.isLogin && !this.captcha) {
          this.errorMessage = '请输入验证码';
          return;
        }

        const url = this.isLogin ? '/api/login' : '/api/register';
        const data = {
          username: this.username,
          password: this.password
        };

        if (this.isLogin) {
          data.captcha = this.captcha;
          data.captchaId = this.captchaId;
        }

        const response = await axios.post(`http://localhost:3000${url}`, data);

        if (response.data.success) {
          if (this.isLogin) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', this.username);
            localStorage.setItem('isLoggedIn', 'true');
            
            if (this.rememberAccount) {
              localStorage.setItem('rememberedAccount', this.username);
            } else {
              localStorage.removeItem('rememberedAccount');
            }
            
            await this.$router.push('/');
          } else {
            this.errorMessage = '注册成功，请登录';
            this.isLogin = true;
            this.password = '';
            this.confirmPassword = '';
          }
        } else {
          this.errorMessage = response.data.message || '操作失败';
          if (this.isLogin) {
            this.refreshCaptcha();
          }
        }
      } catch (error) {
        console.error('请求错误:', error);
        this.errorMessage = error.response?.data?.message || '操作失败，请重试';
        if (this.isLogin) {
          this.refreshCaptcha();
        }
      } finally {
        this.loading = false;
      }
    },
    async refreshCaptcha() {
      try {
        const response = await axios.get('http://localhost:3000/api/captcha');
        this.captchaImage = response.data.image;
        this.captchaId = response.data.captchaId;
        this.captcha = '';
      } catch (error) {
        console.error('获取验证码失败:', error);
        this.$message.error('获取验证码失败，请刷新页面重试');
      }
    },
    handleFocus(input) {
      this.focusedInput = input;
      this.errorMessage = '';
    },
    handleBlur() {
      this.focusedInput = null;
    },
    toggleForm() {
      if (this.loading) return;
      this.isLogin = !this.isLogin;
      this.username = '';
      this.password = '';
      this.confirmPassword = '';
      this.captcha = '';
      this.errorMessage = '';
      if (this.isLogin) {
        this.refreshCaptcha();
      }
    },
    handleForgotPassword() {
      // TODO: 实现忘记密码功能
      this.$message.info('忘记密码功能开发中...');
    },
    handleWechatLogin() {
      // TODO: 实现微信登录
      this.$message.info('微信登录功能开发中...');
    },
    handleQQLogin() {
      // TODO: 实现QQ登录
      this.$message.info('QQ登录功能开发中...');
    }
  },
  mounted() {
    const rememberedAccount = localStorage.getItem('rememberedAccount');
    if (rememberedAccount) {
      this.username = rememberedAccount;
      this.rememberAccount = true;
    }
    if (this.isLogin) {
      this.refreshCaptcha();
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
  position: relative;
  overflow: hidden;
  padding: 40px;
  box-sizing: border-box;
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.login-box {
  width: 100%;
  max-width: 800px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 10;
  transform: translateY(0);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  gap: 40px;
}

.login-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
}

.login-box-register {
  max-width: 850px;
}

.login-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-right: 30px;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 350px;
}

.logo-container {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
}

.logo-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  animation: pulse 2s infinite;
  box-shadow: 0 0 25px rgba(255, 107, 107, 0.4);
}

.logo-circle:nth-child(2) {
  animation-delay: 0.2s;
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  box-shadow: 0 0 25px rgba(79, 172, 254, 0.4);
}

.logo-circle:nth-child(3) {
  animation-delay: 0.4s;
  background: linear-gradient(45deg, #43e97b, #38f9d7);
  box-shadow: 0 0 25px rgba(67, 233, 123, 0.4);
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.title {
  font-size: 32px;
  color: #2c3e50;
  margin: 0 0 14px;
  font-weight: 700;
  background: linear-gradient(45deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  text-align: center;
}

.form-item {
  position: relative;
  transition: all 0.3s ease;
}

.form-item-error {
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
  transition: all 0.3s ease;
  font-size: 20px;
}

input {
  width: 100%;
  padding: 14px 14px 14px 45px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
  height: 52px;
  color: #2c3e50;
}

input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 5px rgba(52, 152, 219, 0.15);
  background: #ffffff;
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

input.focused + .input-icon {
  color: #3498db;
  transform: translateY(-50%) scale(1.1);
}

.login-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 20px rgba(52, 152, 219, 0.3);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(52, 152, 219, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0));
  transform: translateX(-100%);
  transition: transform 0.4s ease;
}

.login-button:hover:not(:disabled) .button-effect {
  transform: translateX(100%);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

.switch-form {
  text-align: center;
  margin-top: 15px;
}

.switch-form span {
  color: #3498db;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  font-weight: 500;
}

.switch-hover:hover {
  color: #2980b9;
}

.switch-hover:hover::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #3498db;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.error-message {
  color: #e74c3c;
  background-color: #fdf3f2;
  border: 1px solid #fadbd8;
  padding: 16px;
  border-radius: 14px;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fadeIn 0.3s ease;
  margin-bottom: 24px;
  box-shadow: 0 3px 15px rgba(231, 76, 60, 0.1);
}

.error-shake {
  animation: shake 0.5s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.background-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite;
  box-shadow: 0 0 50px rgba(255, 255, 255, 0.1);
}

.circle:nth-child(1) {
  width: 500px;
  height: 500px;
  top: -250px;
  left: -250px;
  animation-delay: 0s;
}

.circle:nth-child(2) {
  width: 400px;
  height: 400px;
  top: 50%;
  right: -200px;
  animation-delay: 2s;
}

.circle:nth-child(3) {
  width: 350px;
  height: 350px;
  bottom: -175px;
  left: 50%;
  animation-delay: 4s;
}

.circle:nth-child(4) {
  width: 450px;
  height: 450px;
  top: 20%;
  left: 60%;
  animation-delay: 6s;
}

.circle:nth-child(5) {
  width: 380px;
  height: 380px;
  bottom: 20%;
  right: 20%;
  animation-delay: 8s;
}

@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(50px, -70px) rotate(120deg); }
  66% { transform: translate(-30px, 30px) rotate(240deg); }
  100% { transform: translate(0, 0) rotate(360deg); }
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
}

.password-toggle:hover {
  color: #3498db;
  transform: translateY(-50%) scale(1.1);
}

.password-strength {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-bar {
  flex: 1;
  display: flex;
  gap: 4px;
}

.strength-segment {
  flex: 1;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.strength-weak .strength-segment:first-child {
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
}

.strength-medium .strength-segment:not(:last-child) {
  background: linear-gradient(90deg, #faad14, #ffc53d);
}

.strength-strong .strength-segment {
  background: linear-gradient(90deg, #52c41a, #73d13d);
}

.strength-text {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
  min-width: 24px;
  text-align: right;
}

.captcha-container {
  display: flex;
  gap: 16px;
}

.captcha-image {
  width: 150px;
  height: 52px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  padding: 4px;
  box-sizing: border-box;
}

.captcha-image:hover {
  transform: scale(1.02);
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.captcha-loading {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  font-size: 16px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #666;
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remember-me input[type="checkbox"]:checked {
  background: #3498db;
  border-color: #3498db;
}

.forgot-password {
  color: #1890ff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.forgot-password:hover {
  color: #096dd9;
  text-decoration: underline;
}

.social-login {
  margin-top: 30px;
}

.social-divider {
  display: flex;
  align-items: center;
  margin: 30px 0;
  color: #666;
}

.social-divider::before,
.social-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #eee;
}

.social-divider span {
  padding: 0 16px;
  font-size: 16px;
  color: #666;
}

.social-buttons {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.social-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.social-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.social-button.wechat {
  color: #07C160;
  background: rgba(7, 193, 96, 0.1);
}

.social-button.wechat:hover {
  background: rgba(7, 193, 96, 0.2);
}

.social-button.qq {
  color: #12B7F5;
  background: rgba(18, 183, 245, 0.1);
}

.social-button.qq:hover {
  background: rgba(18, 183, 245, 0.2);
}

@media (max-width: 1024px) {
  .login-box {
    flex-direction: column;
    max-width: 500px;
    gap: 30px;
  }
  
  .login-header {
    padding-right: 0;
    padding-bottom: 30px;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .login-form {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .login-box {
    padding: 24px;
    max-width: 380px;
  }
  
  .title {
    font-size: 28px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  input {
    font-size: 14px;
    padding: 12px 12px 12px 40px;
    height: 46px;
  }
  
  .login-button {
    height: 46px;
    font-size: 14px;
  }
  
  .social-buttons {
    gap: 20px;
  }
  
  .social-button {
    width: 42px;
    height: 42px;
    font-size: 20px;
  }
  
  .captcha-image {
    width: 100px;
    height: 46px;
  }
}
</style> 