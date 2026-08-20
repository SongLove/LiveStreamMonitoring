<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { anchorApi, subscriptionApi } from '@/api'
import type { Anchor, Subscription } from '@/types/api'
import { liveStateLabel, platformIdLabel, isLive } from '@/utils/format'

const anchor = ref<Anchor | null>(null)
const subscription = ref<Subscription | null>(null)
const sessionId = ref('')

async function load(anchorId: string) {
  anchor.value = await anchorApi.detail(anchorId)
  const subs = await subscriptionApi.list()
  subscription.value = subs.find((s) => s.anchorId === anchorId) || null
}

async function toggleEnabled(enabled: boolean) {
  if (!subscription.value) return
  subscription.value = await subscriptionApi.update(subscription.value._id, { enabled })
}

function copyLink() {
  const url = anchor.value?.profileUrl
  if (!url) {
    uni.showToast({ title: '暂无链接', icon: 'none' })
    return
  }
  uni.showModal({
    title: '进入直播间',
    content: '即将复制直播间链接，请前往对应 App 打开',
    success: (res) => {
      if (res.confirm) {
        uni.setClipboardData({ data: url })
      }
    },
  })
}

async function goAddFollow() {
  uni.navigateTo({ url: '/pages-sub/anchor/add' })
}

async function unfollow() {
  if (!subscription.value) return
  uni.showModal({
    title: '取消监听',
    content: '确定取消对该主播的监听？',
    success: async (res) => {
      if (res.confirm) {
        await subscriptionApi.remove(subscription.value!._id)
        uni.navigateBack()
      }
    },
  })
}

onLoad((query) => {
  const id = query?.id as string
  sessionId.value = (query?.sessionId as string) || ''
  if (id) load(id)
})
</script>

<template>
  <view class="page-wrap">
    <view v-if="sessionId" class="session-banner section-card">
      <text>来自推送通知 · 场次 {{ sessionId.slice(-6) }}</text>
    </view>

    <view v-if="anchor" class="section-card profile">
      <image class="avatar" :src="anchor.avatarUrl" mode="aspectFill" />
      <text class="name">{{ anchor.nickname }}</text>
      <text class="uid">{{ platformIdLabel(anchor.platform, anchor.platformUid, anchor.roomId) }}</text>
      <view class="status-row">
        <text :class="isLive(anchor.liveState) ? 'live' : 'offline'">{{ liveStateLabel(anchor.liveState) }}</text>
        <text v-if="anchor.lastPolledAt" class="updated">数据可能延迟</text>
      </view>
      <text v-if="anchor.liveTitle" class="title">{{ anchor.liveTitle }}</text>
    </view>

    <view v-if="subscription" class="section-card">
      <view class="row">
        <text>提醒开关</text>
        <switch :checked="subscription.enabled" color="#16a34a" @change="toggleEnabled(($event as any).detail.value)" />
      </view>
    </view>

    <button v-if="isLive(anchor?.liveState)" class="btn-primary" @tap="copyLink">进入直播间</button>
    <button v-if="subscription" class="ghost-btn" @tap="unfollow">取消监听</button>
    <button v-else class="btn-primary" @tap="goAddFollow">去添加关注</button>
  </view>
</template>

<style lang="scss" scoped>
.profile {
  text-align: center;
  padding: 48rpx 28rpx;
}
.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  margin-bottom: 16rpx;
}
.name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}
.uid {
  color: #94a3b8;
  font-size: 26rpx;
}
.status-row {
  margin: 16rpx 0;
}
.live {
  color: #16a34a;
  font-weight: 600;
}
.offline {
  color: #94a3b8;
}
.updated {
  display: block;
  font-size: 22rpx;
  color: #cbd5e1;
}
.title {
  font-size: 28rpx;
  color: #64748b;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ghost-btn {
  margin-top: 24rpx;
  background: transparent;
  color: #dc2626;
  border: 1rpx solid #fecaca;
  border-radius: 999rpx;
}
.session-banner {
  background: #dcfce7;
  color: #15803d;
  font-size: 26rpx;
}
</style>
