<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/types/api'

const props = defineProps<{
  categories: Category[]
  activeId: string
  countFn: (id: string) => number
}>()

const emit = defineEmits<{ change: [id: string] }>()

const tabs = computed(() => [
  { _id: '__all__', name: '全部', count: props.countFn('__all__') },
  { _id: '__uncategorized__', name: '未分类', count: props.countFn('__uncategorized__') },
  ...props.categories.map((c) => ({ ...c, count: props.countFn(c._id) })),
])
</script>

<template>
  <scroll-view scroll-x class="tabs-scroll" show-scrollbar="false">
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab._id"
        class="tab"
        :class="{ active: activeId === tab._id }"
        @tap="emit('change', tab._id)"
      >
        {{ tab.name }}
        <text v-if="tab.count" class="count">({{ tab.count }})</text>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.tabs-scroll {
  white-space: nowrap;
  margin-bottom: 24rpx;
}
.tabs {
  display: inline-flex;
  gap: 16rpx;
  padding: 8rpx 0;
}
.tab {
  display: inline-flex;
  align-items: center;
  padding: 16rpx 28rpx;
  border-radius: 999rpx;
  background: #f1f5f9;
  color: #64748b;
  font-size: 28rpx;
  &.active {
    background: #dcfce7;
    color: #15803d;
    font-weight: 600;
  }
}
.count {
  margin-left: 4rpx;
  font-size: 24rpx;
}
</style>
