<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { notifyApi, anchorApi } from '@/api'
import type { NotifyLog, Anchor } from '@/types/api'
import { NOTIFY_SKIP_LABELS } from '@/types/api'
import dayjs from 'dayjs'

const logs = ref<NotifyLog[]>([])
const anchorMap = ref<Record<string, Anchor>>({})
const loading = ref(false)

function stateLabel(state: string) {
  const map: Record<string, string> = {
    pending: '待发送',
    sent: '已发送',
    success: '已送达',
    failed: '失败',
    skipped: '跳过',
  }
  return map[state] || state
}

function skipLabel(reason: string) {
  return NOTIFY_SKIP_LABELS[reason] || reason || '-'
}

async function load() {
  loading.value = true
  try {
    const res = await notifyApi.logs(1, 50)
    logs.value = res.items
    const ids = [...new Set(res.items.map((l) => l.anchorId))]
    const anchors = await Promise.all(ids.map((id) => anchorApi.detail(id).catch(() => null)))
    const map: Record<string, Anchor> = {}
    anchors.forEach((a) => {
      if (a) map[a._id] = a
    })
    anchorMap.value = map
  } finally {
    loading.value = false
  }
}

function goHelp() {
  uni.navigateTo({ url: '/pages/help/index' })
}

onMounted(load)
</script>

<template>
  <view class="page-wrap">
    <view v-if="loading" class="empty-wrap">加载中...</view>
    <view v-else-if="!logs.length" class="empty-wrap">暂无推送记录</view>

    <view v-for="log in logs" :key="log._id" class="section-card log">
      <view class="head">
        <text class="name">{{ anchorMap[log.anchorId]?.nickname || log.anchorId }}</text>
        <text class="state" :class="log.state">{{ stateLabel(log.state) }}</text>
      </view>
      <text class="time">{{ dayjs(log.createdAt).format('YYYY-MM-DD HH:mm') }}</text>
      <text v-if="log.skipReason && log.state === 'skipped'" class="reason">{{ skipLabel(log.skipReason) }}</text>
      <text v-if="log.state === 'failed'" class="link" @tap="goHelp">为什么没有收到？</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.log {
  margin-bottom: 16rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.name {
  font-weight: 600;
  font-size: 30rpx;
}
.state {
  font-size: 24rpx;
  &.success,
  &.sent {
    color: #16a34a;
  }
  &.failed {
    color: #dc2626;
  }
  &.skipped {
    color: #94a3b8;
  }
}
.time {
  font-size: 24rpx;
  color: #94a3b8;
}
.reason {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #64748b;
}
.link {
  display: block;
  margin-top: 8rpx;
  color: #16a34a;
  font-size: 26rpx;
}
</style>
