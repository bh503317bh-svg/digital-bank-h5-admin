<template>
  <div class="wrap">
    <el-card class="card">
      <h2>aku-bank Admin</h2>
      <p class="sub">Operations console · USD demo</p>
      <el-form @submit.prevent="onSubmit">
        <el-form-item label="Mobile">
          <el-input v-model="mobile" placeholder="13900000001" />
        </el-form-item>
        <el-form-item label="Password">
          <el-input v-model="password" type="password" show-password />
        </el-form-item>
        <el-button type="primary" native-type="submit" style="width:100%" :loading="loading">
          Sign in
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../api'

const mobile = ref('13900000001')
const password = ref('Admin123!')
const loading = ref(false)
const router = useRouter()

async function onSubmit() {
  loading.value = true
  try {
    const res = await login(mobile.value, password.value)
    if (res.code !== 0) {
      ElMessage.error(res.message || 'Sign-in failed')
      return
    }
    if (res.data.role !== 'admin') {
      ElMessage.error('Admin account required')
      return
    }
    localStorage.setItem('wb_admin_token', res.data.access_token)
    router.replace('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0b1f44, #123a7a);
}
.card { width: 420px; }
h2 { margin: 0; color: #123a7a; }
.sub { margin: 6px 0 18px; color: #8090a8; font-size: 13px; }
</style>
