<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLayoutStore } from '@/stores/layout'

const layout = useLayoutStore()

onMounted(() => {
  if (!layout.ready) layout.init()
})

/** 总高度 = 状态栏 + 内容行；用 padding-top 把内容顶到胶囊行 */
const barStyle = computed(() => ({
  paddingTop: `${layout.statusBarHeight}px`,
  height: `${layout.navBarHeight}px`,
  boxSizing: 'border-box' as const,
}))

const rowStyle = computed(() => ({
  height: `${layout.navContentHeight}px`,
  paddingRight: `${layout.navPaddingRight}px`,
}))
</script>

<template>
  <view class="custom-nav" :style="barStyle">
    <view class="custom-nav__row" :style="rowStyle">
      <view class="custom-nav__main">
        <slot />
      </view>
      <view v-if="$slots.right" class="custom-nav__right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #ecfdf5;
}

.custom-nav__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 32rpx;
  box-sizing: border-box;
}

.custom-nav__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 100%;
}

.custom-nav__right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 100%;
  margin-left: 16rpx;
}
</style>
