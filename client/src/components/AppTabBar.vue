<script setup lang="ts">
defineProps<{ current: string }>()

const tabs = [
  { key: 'monitor', path: '/pages/index/index', label: '监控', icon: '🏠' },
  { key: 'media', path: '/pages/media/index', label: '传媒监控', icon: '👥' },
  { key: 'replay', path: '/pages/replay/index', label: '直播回放', icon: '⏱' },
  { key: 'settings', path: '/pages/settings/index', label: '设置', icon: '⚙️' },
  { key: 'help', path: '/pages/help/index', label: '帮助', icon: '❓' },
]

function switchTab(path: string) {
  uni.reLaunch({ url: path })
}
</script>

<template>
  <view class="tabbar">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: current === tab.key }"
      @tap="switchTab(tab.path)"
    >
      <view class="icon-wrap">
        <text class="icon">{{ tab.icon }}</text>
      </view>
      <text class="label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  display: flex;
  border-top: 1rpx solid #e2e8f0;
  z-index: 100;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 22rpx;

  &.active {
    color: #16a34a;

    .icon-wrap {
      background: radial-gradient(circle, rgba(34, 197, 94, 0.28), transparent 70%);
    }
  }
}

.icon-wrap {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 4rpx;
}

.icon {
  font-size: 36rpx;
}
</style>
