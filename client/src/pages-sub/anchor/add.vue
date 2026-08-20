<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Anchor, Platform } from '@/types/api'
import { anchorApi, subscriptionApi } from '@/api'
import { useCategoryStore } from '@/stores/subscription'
import { trackEvent } from '@/utils/analytics'
import { ApiError } from '@/utils/request'
import { liveStateLabel, platformIdLabel } from '@/utils/format'

const platform = ref<Platform>('douyin')
const input = ref('')
const results = ref<Anchor[]>([])
const selected = ref<Anchor | null>(null)
const error = ref('')
const loading = ref(false)
const categoryStore = useCategoryStore()

const placeholder = computed(() =>
  platform.value === 'douyin'
    ? '输入抖音号，例如 kelie329157'
    : '输入 B 站 UID，或粘贴直播间/空间链接',
)

const tip = computed(() =>
  platform.value === 'douyin'
    ? '按抖音号（用户 ID）搜索，例如 kelie329157。主页里「抖音号」那一串，不是昵称。'
    : '按 UID 搜索：支持数字 UID 或直播间/空间链接。',
)

const actionLabel = computed(() => (platform.value === 'douyin' ? '按 ID 搜索' : '搜索'))

watch(platform, () => {
  results.value = []
  selected.value = null
  error.value = ''
})

async function onSearch() {
  const q = input.value.trim()
  if (!q) return
  loading.value = true
  error.value = ''
  results.value = []
  selected.value = null
  try {
    const list = await anchorApi.search(platform.value, q)
    if (!list.length) {
      // 兜底：B 站链接等走 resolve
      if (platform.value === 'bilibili') {
        const one = await anchorApi.resolve(platform.value, q)
        results.value = [one]
        selected.value = one
      } else {
        error.value = '未找到该用户 ID，请检查后重试'
      }
    } else {
      results.value = list
      selected.value = list[0] || null
      trackEvent('search_anchor')
      trackEvent('resolve_success')
    }
  } catch (e: unknown) {
    error.value = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '搜索失败'
  } finally {
    loading.value = false
  }
}

function pick(item: Anchor) {
  selected.value = item
}

async function onFollow() {
  if (!selected.value) return
  loading.value = true
  try {
    await subscriptionApi.add(selected.value._id)
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

    <text class="tip">{{ tip }}</text>

    <textarea
      v-model="input"
      class="input-area"
      :placeholder="placeholder"
      :maxlength="500"
    />

    <button class="btn-primary" :loading="loading" @tap="onSearch">{{ actionLabel }}</button>

    <view v-if="error" class="error">{{ error }}</view>

    <view v-for="item in results" :key="item._id" class="section-card result" @tap="pick(item)">
      <image class="avatar" :src="item.avatarUrl" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ item.nickname }}</text>
        <text class="uid">{{ platformIdLabel(item.platform, item.platformUid, item.roomId) }}</text>
        <text class="status">{{ liveStateLabel(item.liveState) }}</text>
      </view>
      <text v-if="selected?._id === item._id" class="picked">已选</text>
    </view>

    <button
      v-if="selected"
      class="btn-primary follow"
      :loading="loading"
      @tap="onFollow"
    >
      关注选中主播
    </button>
  </view>
</template>

<style lang="scss" scoped>
.platform-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
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
.tip {
  display: block;
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 16rpx;
}
.input-area {
  width: 100%;
  min-height: 160rpx;
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
  margin-top: 24rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #e2e8f0;
}
.info {
  flex: 1;
}
.name {
  display: block;
  font-weight: 600;
}
.uid {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 4rpx;
  word-break: break-all;
}
.status {
  font-size: 24rpx;
  color: #94a3b8;
}
.picked {
  font-size: 24rpx;
  color: #15803d;
  font-weight: 600;
}
.follow {
  margin-top: 32rpx;
}
</style>
