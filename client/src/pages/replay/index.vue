<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import AppTabBar from '@/components/AppTabBar.vue'
import PageShell from '@/components/PageShell.vue'
import { hideNativeTabBar } from '@/utils/tabbar'
import { useAuthStore } from '@/stores/auth'
import { liveApi, anchorApi } from '@/api'
import type { Anchor, LiveSession } from '@/types/api'
import dayjs from 'dayjs'

const auth = useAuthStore()
const sessions = ref<LiveSession[]>([])
const anchorMap = ref<Record<string, Anchor>>({})
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await liveApi.sessions(1, 30)
    sessions.value = res.items
    const ids = [...new Set(res.items.map((s) => s.anchorId))]
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

function fmtTime(iso: string) {
  return dayjs(iso).format('MM-DD HH:mm')
}

function goDetail(anchorId: string) {
  uni.navigateTo({ url: `/pages-sub/anchor/detail?id=${anchorId}` })
}

onShow(() => {
  hideNativeTabBar()
  if (!auth.isLoggedIn) uni.reLaunch({ url: '/pages/login/index' })
  else load()
})
onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})
onMounted(load)
</script>

<template>
  <PageShell with-tab-bar>
    <template #nav>
      <text class="nav-title">直播回放</text>
    </template>
    <view class="page-wrap">
      <view v-if="loading" class="empty-wrap">加载中...</view>
      <view v-else-if="!sessions.length" class="empty-wrap">暂无开播记录</view>

      <view v-for="s in sessions" :key="s._id" class="section-card session" @tap="goDetail(s.anchorId)">
        <image
          class="cover"
          :src="s.coverUrl || anchorMap[s.anchorId]?.avatarUrl"
          mode="aspectFill"
        />
        <view class="meta">
          <text class="title">{{ s.title || anchorMap[s.anchorId]?.nickname || '直播场次' }}</text>
          <text class="time">{{ fmtTime(s.startedAt) }} · {{ s.status === 'ended' ? '已结束' : '直播中' }}</text>
        </view>
      </view>
    </view>
    <template #footer>
      <AppTabBar current="replay" />
    </template>
  </PageShell>
</template>

<style lang="scss" scoped>
.session {
  display: flex;
  gap: 20rpx;
  align-items: center;
}
.cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  background: #e2e8f0;
}
.meta {
  flex: 1;
}
.title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.time {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 8rpx;
}
</style>
