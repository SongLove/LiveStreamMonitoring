<script setup lang="ts">
import { ref } from 'vue'
import type { Platform } from '@/types/api'
import { anchorApi, subscriptionApi } from '@/api'
import { useCategoryStore } from '@/stores/subscription'
import { trackEvent } from '@/utils/analytics'
import { ApiError } from '@/utils/request'
import { liveStateLabel } from '@/utils/format'

const platform = ref<Platform>('douyin')
const input = ref('')
const resolved = ref<Awaited<ReturnType<typeof anchorApi.resolve>> | null>(null)
const error = ref('')
const loading = ref(false)
const categoryStore = useCategoryStore()

async function onResolve() {
  if (!input.value.trim()) return
  loading.value = true
  error.value = ''
  resolved.value = null
  try {
    resolved.value = await anchorApi.resolve(platform.value, input.value.trim())
    trackEvent('resolve_success')
  } catch (e: unknown) {
    error.value = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '解析失败'
  } finally {
    loading.value = false
  }
}

async function onFollow() {
  if (!resolved.value) return
  loading.value = true
  try {
    await subscriptionApi.add(resolved.value._id)
    trackEvent('follow_success')
    uni.showModal({
      title: '关注成功',
      content: '是否现在授权推送次数？（需您主动点击确认）',
      confirmText: '去授权',
      success: (res) => {
        if (res.confirm) uni.navigateTo({ url: '/pages-sub/quota/guide' })
        else uni.navigateBack()
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '关注失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}

categoryStore.fetchCategories()
</script>

<template>
  <view class="page-wrap">
    <view class="platform-tabs">
      <view class="p-tab" :class="{ active: platform === 'douyin' }" @tap="platform = 'douyin'">抖音</view>
      <view class="p-tab" :class="{ active: platform === 'bilibili' }" @tap="platform = 'bilibili'">哔哩哔哩</view>
    </view>

    <textarea
      v-model="input"
      class="input-area"
      placeholder="粘贴分享链接、直播间链接或平台 ID"
      :maxlength="500"
    />

    <button class="btn-primary" :loading="loading" @tap="onResolve">解析</button>

    <view v-if="error" class="error">{{ error }}</view>

    <view v-if="resolved" class="section-card result">
      <image class="avatar" :src="resolved.avatarUrl" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ resolved.nickname }}</text>
        <text class="status">{{ liveStateLabel(resolved.liveState) }}</text>
      </view>
      <button class="mini-btn" @tap="onFollow">关注</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.platform-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.p-tab {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  background: #f1f5f9;
  border-radius: 16rpx;
  &.active {
    background: #dcfce7;
    color: #15803d;
    font-weight: 600;
  }
}
.input-area {
  width: 100%;
  min-height: 200rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
}
.error {
  color: #dc2626;
  margin-top: 16rpx;
  font-size: 26rpx;
}
.result {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 32rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
}
.info {
  flex: 1;
}
.name {
  display: block;
  font-weight: 600;
}
.status {
  font-size: 24rpx;
  color: #94a3b8;
}
</style>
