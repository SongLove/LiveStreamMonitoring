<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { trackEvent } from '@/utils/analytics'

const auth = useAuthStore()
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await auth.login()
    trackEvent('login_success')
    uni.reLaunch({ url: '/pages/index/index' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '登录失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (auth.isLoggedIn) uni.reLaunch({ url: '/pages/index/index' })
})
</script>

<template>
  <view class="login-page">
    <view class="hero">
      <text class="title">主播开播监控</text>
      <text class="subtitle">主播开播，第一时间通知你</text>
    </view>
    <button class="btn-primary login-btn" :loading="loading" @tap="handleLogin">微信一键登录</button>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
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
</style>
