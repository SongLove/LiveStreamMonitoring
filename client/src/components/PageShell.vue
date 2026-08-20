<script setup lang="ts">
import { computed, onMounted, useSlots } from 'vue'
import CustomNavBar from '@/components/CustomNavBar.vue'
import { useLayoutStore } from '@/stores/layout'

const props = withDefaults(
  defineProps<{
    withTabBar?: boolean
    statusBar?: boolean
    topMode?: 'nav' | 'status' | 'none'
  }>(),
  {
    withTabBar: false,
    statusBar: true,
    topMode: 'nav',
  },
)

const slots = useSlots()
const layout = useLayoutStore()
const hasNav = computed(() => !!slots.nav)

onMounted(() => {
  if (!layout.ready) layout.init()
})

const shellStyle = computed(() => {
  let top = 0
  if (props.topMode === 'status') {
    top = layout.statusBarHeight
  } else if (props.topMode === 'nav') {
    top = layout.navBarHeight
  }
  const bottom = props.withTabBar ? layout.pageBottomWithTab : layout.pageBottom
  return {
    paddingTop: `${top}px`,
    paddingBottom: `${bottom}px`,
    ...layout.cssVars,
  }
})

const statusBarStyle = computed(() => ({
  height: `${layout.statusBarHeight}px`,
}))
</script>

<template>
  <view class="page-shell" :style="shellStyle">
    <view v-if="statusBar && !hasNav" class="status-bar-fill" :style="statusBarStyle" />
    <CustomNavBar v-if="hasNav">
      <slot name="nav" />
      <template v-if="$slots['nav-right']" #right>
        <slot name="nav-right" />
      </template>
    </CustomNavBar>
    <view class="page-shell__body">
      <slot />
    </view>
    <slot name="footer" />
  </view>
</template>

<style lang="scss" scoped>
.page-shell {
  min-height: 100vh;
  box-sizing: border-box;
  position: relative;
}

.status-bar-fill {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99;
  background: #ecfdf5;
  pointer-events: none;
}

.page-shell__body {
  width: 100%;
}
</style>
