<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useSubscribeMessage } from '@/composables/useSubscribe'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()
const { requestSubscribe } = useSubscribeMessage()
const loading = ref(false)

async function onAuthorize() {
  loading.value = true
  try {
    await requestSubscribe()
    await profileStore.fetchProfile()
  } finally {
    loading.value = false
  }
}

onLoad(async () => {
  await profileStore.fetchProfile()
})
</script>

<template>
  <view class="page-wrap">
    <view class="hero">
      <text class="num">{{ profileStore.quotaBalance }}</text>
      <text class="label">当前剩余次数（上限 {{ profileStore.quotaMax }}）</text>
    </view>

    <view class="section-card rules">
      <text class="rules-title">授权说明</text>
      <text class="rules-item">· 微信一次性订阅：每次授权可累积 1 次下发权限</text>
      <text class="rules-item">· 不支持批量勾选多次，需连续点击授权</text>
      <text class="rules-item">· 额度以服务端为准，授权后自动刷新</text>
      <text class="rules-item">· 不承诺绝对送达，受微信与网络影响</text>
    </view>

    <button class="btn-primary auth-btn" :loading="loading" @tap="onAuthorize">
      点击授权增加 1 次
    </button>
  </view>
</template>

<style lang="scss" scoped>
.hero {
  text-align: center;
  padding: 48rpx 0;
}
.num {
  display: block;
  font-size: 120rpx;
  font-weight: 800;
  color: #16a34a;
  line-height: 1;
}
.label {
  color: #64748b;
  font-size: 28rpx;
}
.rules-title {
  display: block;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.rules-item {
  display: block;
  font-size: 26rpx;
  color: #64748b;
  line-height: 1.8;
}
.auth-btn {
  margin-top: 48rpx;
  width: 100%;
}
</style>
