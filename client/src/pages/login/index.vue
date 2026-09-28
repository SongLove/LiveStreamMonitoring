<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api'
import { ApiError } from '@/utils/request'
import { trackEvent } from '@/utils/analytics'
import PageShell from '@/components/PageShell.vue'

const auth = useAuthStore()
const loading = ref(true)
const tip = ref('正在进入…')
const MIN_SPLASH_MS = 1200

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function doLogin(code: string) {
  const data = await authApi.login(code)
  auth.accessToken = data.accessToken
  auth.userId = data.user.id
  auth.nickname = data.user.nickname
  auth.avatarUrl = data.user.avatarUrl
  uni.setStorageSync('accessToken', data.accessToken)
  trackEvent('login_success')
}

async function autoEnter() {
  const started = Date.now()
  loading.value = true
  tip.value = '正在进入…'

  try {
    if (!auth.isLoggedIn) {
      tip.value = '正在登录…'
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

    const elapsed = Date.now() - started
    if (elapsed < MIN_SPLASH_MS) await sleep(MIN_SPLASH_MS - elapsed)
    uni.switchTab({ url: '/pages/index/index' })
  } catch (e: unknown) {
    loading.value = false
    tip.value = '登录失败，点击重试'
    const msg = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '登录失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

onMounted(() => {
  autoEnter()
})
</script>

<template>
  <PageShell top-mode="status" :status-bar="true">
    <view class="login-page" @tap="!loading && autoEnter()">
      <view class="hero">
        <text class="title">煮啵开播助手</text>
        <text class="subtitle">煮啵开播，第一时间通知你</text>
      </view>
      <view class="splash">
        <view v-if="loading" class="spinner" />
        <text class="tip">{{ tip }}</text>
      </view>
    </view>
  </PageShell>
</template>

<style lang="scss" scoped>
.login-page {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64rpx;
  background: linear-gradient(180deg, #ecfdf5, #f8fafc);
}
.hero {
  text-align: center;
  margin-bottom: 80rpx;
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
.splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}
.spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #bbf7d0;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.tip {
  font-size: 26rpx;
  color: #94a3b8;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
