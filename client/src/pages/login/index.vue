<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api'
import { ApiError } from '@/utils/request'
import { trackEvent } from '@/utils/analytics'
import PageShell from '@/components/PageShell.vue'

const auth = useAuthStore()
const loading = ref(false)

async function doLogin(code: string) {
  loading.value = true
  try {
    const data = await authApi.login(code)
    auth.accessToken = data.accessToken
    auth.userId = data.user.id
    auth.nickname = data.user.nickname
    auth.avatarUrl = data.user.avatarUrl
    uni.setStorageSync('accessToken', data.accessToken)
    trackEvent('login_success')
    uni.switchTab({ url: '/pages/index/index' })
  } catch (e: unknown) {
    const msg = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '登录失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  // #ifdef MP-WEIXIN
  const { code } = await new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({ provider: 'weixin', success: resolve, fail: reject })
  })
  await doLogin(code)
  // #endif
  // #ifdef H5
  await doLogin('test')
  // #endif
}

onMounted(() => {
  if (auth.isLoggedIn) uni.switchTab({ url: '/pages/index/index' })
})
</script>

<template>
  <PageShell top-mode="status" :status-bar="true">
    <view class="login-page">
      <view class="hero">
        <text class="title">主播开播监控</text>
        <text class="subtitle">主播开播，第一时间通知你</text>
      </view>
      <button class="btn-primary login-btn" :loading="loading" @tap="handleLogin">微信一键登录</button>
      <!-- #ifdef H5 -->
      <text class="dev-hint">H5 开发模式使用 POST /auth/login code=test</text>
      <!-- #endif -->
    </view>
  </PageShell>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64rpx;
  background: linear-gradient(180deg, #ecfdf5, #f8fafc);
}
.hero {
  text-align: center;
  margin-bottom: 120rpx;
}
.title {
  display: block;
  font-size: 56rpx;
  font-weight: 800;
  color: #16a34a;
  margin-bottom: 16rpx;
}
.subtitle {
  color: #64748b;
  font-size: 28rpx;
}
.login-btn {
  width: 100%;
  max-width: 560rpx;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  border-radius: 999rpx;
  height: 96rpx;
  line-height: 96rpx;
}
.dev-hint {
  margin-top: 24rpx;
  font-size: 22rpx;
  color: #94a3b8;
}
</style>
