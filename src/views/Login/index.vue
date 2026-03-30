<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-logo">NSOAR 登录</div>
      <el-form :model="form" :rules="rules" ref="formRef" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
            show-password
          />
        </el-form-item>
        <el-form-item prop="captcha">
          <div style="display: flex; width: 100%; gap: 10px;">
            <el-input
              v-model="form.captcha"
              placeholder="请输入验证码"
              @keyup.enter="handleLogin"
              style="flex: 1"
            />
            <div
              class="captcha-img-box"
              @click="loadCaptcha"
              v-loading="loadingCaptcha"
            >
              <img v-if="captchaImage" :src="captchaImage" class="captcha-img" />
              <span v-else class="captcha-placeholder">加载验证码</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)

const form = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaKey: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const loading = ref(false)
const loadingCaptcha = ref(false)
const captchaImage = ref('')

const loadCaptcha = async () => {
  loadingCaptcha.value = true
  try {
    const res = await request.get('/getCaptcha')
    // 后端返回结构为 { base64Image: "...", captchaKey: "..." }
    if (res && res.captchaKey) {
      form.captchaKey = res.captchaKey
      captchaImage.value = 'data:image/png;base64,' + res.base64Image
    } else if (res && res.uuid) {
      // 兼容旧接口设计
      form.captchaKey = res.uuid
      captchaImage.value = 'data:image/jpeg;base64,' + (res.img || res.base64Image)
    } else {
      // 降级处理
      captchaImage.value = res.img || res.base64Image || res
    }
  } catch (err) {
    ElMessage.error('获取验证码失败')
  } finally {
    loadingCaptcha.value = false
  }
}

const handleLogin = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      const res = await request.post('/login', form)
      // 成功返回了包含 jwtToken 的对象
      const token = res && res.jwtToken
      if (token) {
        userStore.setToken(token)
        // 存储更多用户信息
        userStore.userInfo = {
          username: res.username,
          nickname: res.nickname,
          roleId: res.roleId
        }
        ElMessage.success('登录成功')
        router.push('/')
      } else {
        ElMessage.error('登录失败: 未找到有效Token')
        loadCaptcha()
      }
    } catch (err) {
      loadCaptcha()
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  loadCaptcha()
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #101117 0%, #191a23 100%);
}
.login-card {
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}
.login-logo {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 24px;
}
.captcha-img-box {
  width: 120px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.captcha-placeholder {
  font-size: 12px;
  color: #909399;
}
.login-btn {
  width: 100%;
}
</style>
