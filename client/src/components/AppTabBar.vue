<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLayoutStore } from '@/stores/layout'

defineProps<{ current: string }>()

const layout = useLayoutStore()

const tabs = [
  { key: 'monitor', path: '/pages/index/index', label: '监控', icon: '🏠' },
  { key: 'media', path: '/pages/media/index', label: '传媒监控', icon: '👥' },
  { key: 'replay', path: '/pages/replay/index', label: '直播回放', icon: '⏱' },
  { key: 'settings', path: '/pages/settings/index', label: '设置', icon: '⚙️' },
  { key: 'help', path: '/pages/help/index', label: '帮助', icon: '❓' },
]

onMounted(() => {
  if (!layout.ready) layout.init()
})

/** 必须用 switchTab：页面保活，无 reLaunch 整页闪白 */
function onSwitch(path: string, key: string, current: string) {
  if (key === current) return
  uni.switchTab({ url: path })
}

const tabbarStyle = computed(() => ({
  paddingBottom: `${layout.safeAreaBottom}px`,
  height: `${layout.tabBarHeight + layout.safeAreaBottom}px`,
  boxSizing: 'border-box' as const,
}))
</script>

<template>
  <view class="tabbar" :style="tabbarStyle">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: current === tab.key }"
      @tap="onSwitch(tab.path, tab.key, current)"
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
  z-index: 100;
  background: #fff;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #e2e8f0;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 22rpx;
  height: 100%;

  &.active {
    color: #16a34a;

    .icon-wrap {
      background: radial-gradient(circle, rgba(34, 197, 94, 0.28), transparent 70%);
    }
  }
}

.icon-wrap {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 2rpx;
}

.icon {
  font-size: 32rpx;
}
</style>
