<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import AppTabBar from '@/components/AppTabBar.vue'
import PageShell from '@/components/PageShell.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { clearLocalCache } from '@/utils/format'
import { hideNativeTabBar } from '@/utils/tabbar'

const auth = useAuthStore()
const profileStore = useProfileStore()

async function load() {
  await profileStore.fetchProfile()
}

async function patchSettings(partial: Record<string, unknown>) {
  await profileStore.updateSettings(partial as any)
  uni.showToast({ title: '已保存', icon: 'success' })
}

function goLogs() {
  uni.navigateTo({ url: '/pages-sub/notify/logs' })
}

function onClearLocal() {
  uni.showModal({
    title: '清除本地缓存',
    content: '仅清理本设备缓存，不会删除云端监听与分类数据',
    success: (res) => {
      if (res.confirm) {
        clearLocalCache()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    },
  })
}

onShow(() => {
  hideNativeTabBar()
  if (!auth.isLoggedIn) uni.reLaunch({ url: '/pages/login/index' })
  else load()
})
</script>

<template>
  <PageShell with-tab-bar>
    <template #nav>
      <text class="nav-title">功能设置</text>
    </template>
    <view class="page-wrap">
      <view class="section-card">
        <text class="group-title">推送类型</text>
        <view class="row">
          <view class="row-left">
            <text class="row-icon">🔔</text>
            <view>
              <text class="row-label">开播提醒</text>
              <text class="row-desc">主播开播时推送通知</text>
            </view>
          </view>
          <switch
            :checked="profileStore.profile?.settings.notifyEnabled"
            color="#16a34a"
            @change="patchSettings({ notifyEnabled: ($event as any).detail.value })"
          />
        </view>
      </view>

      <view class="section-card">
        <text class="group-title">免打扰设置</text>
        <view class="row">
          <view class="row-left">
            <text class="row-icon">🌙</text>
            <view>
              <text class="row-label">开启免打扰</text>
              <text class="row-desc">在此期间将不会收到任何推送</text>
            </view>
          </view>
          <switch
            :checked="profileStore.profile?.settings.dndEnabled"
            color="#16a34a"
            @change="patchSettings({ dndEnabled: ($event as any).detail.value })"
          />
        </view>
        <view v-if="profileStore.profile?.settings.dndEnabled" class="dnd-time">
          <text>{{ profileStore.profile.settings.dndStart }} - {{ profileStore.profile.settings.dndEnd }}</text>
          <text v-if="profileStore.profile.settings.dndStart > profileStore.profile.settings.dndEnd" class="hint">
            （跨午夜时段）
          </text>
        </view>
      </view>

      <view class="section-card">
        <text class="group-title">高级设置</text>
        <view class="row">
          <view class="row-left">
            <text class="row-icon">📣</text>
            <view>
              <text class="row-label">仅推送大号</text>
              <text class="row-desc">依赖后台主播标签，未标注可能不准确</text>
            </view>
          </view>
          <switch
            :checked="profileStore.profile?.settings.largeAccountOnly"
            color="#16a34a"
            @change="patchSettings({ largeAccountOnly: ($event as any).detail.value })"
          />
        </view>
        <view class="row">
          <view class="row-left">
            <text class="row-icon">🎓</text>
            <view>
              <text class="row-label">学生党模式</text>
              <text class="row-desc">仅在节假日推送（不含寒暑假）</text>
            </view>
          </view>
          <switch
            :checked="profileStore.profile?.settings.studentMode"
            color="#16a34a"
            @change="patchSettings({ studentMode: ($event as any).detail.value })"
          />
        </view>
      </view>

      <view class="section-card">
        <view class="row" @tap="onClearLocal">
          <view class="row-left">
            <text class="row-icon">🗑</text>
            <view>
              <text class="row-label">清除本地缓存</text>
              <text class="row-desc">解决页面显示异常，不删云端数据</text>
            </view>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="row" @tap="goLogs">
          <view class="row-left">
            <text class="row-icon">📋</text>
            <view>
              <text class="row-label">推送记录</text>
              <text class="row-desc">查看历史推送与跳过原因</text>
            </view>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
    <template #footer>
      <AppTabBar current="settings" />
    </template>
  </PageShell>
</template>

<style lang="scss" scoped>
.group-title {
  display: block;
  font-size: 28rpx;
  color: #64748b;
  margin-bottom: 16rpx;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
}
.row-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}
.row-icon {
  font-size: 36rpx;
}
.row-label {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.row-desc {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 4rpx;
}
.arrow {
  color: #cbd5e1;
  font-size: 36rpx;
}
.dnd-time {
  font-size: 26rpx;
  color: #64748b;
  padding-bottom: 16rpx;
}
.hint {
  color: #ea580c;
  margin-left: 8rpx;
}
</style>
