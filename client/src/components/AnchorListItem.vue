<script setup lang="ts">
import type { SubscriptionView } from '@/types/api'
import { formatStatusTime, isLive, platformIdLabel } from '@/utils/format'

defineProps<{
  item: SubscriptionView
  showSwitch?: boolean
}>()

defineEmits<{ toggle: [id: string, enabled: boolean]; tap: [anchorId: string] }>()
</script>

<template>
  <view class="anchor-item" @tap="$emit('tap', item.anchorId)">
    <image class="avatar" :src="item.anchor?.avatarUrl || ''" mode="aspectFill" />
    <view class="info">
      <text class="name">{{ item.anchor?.nickname || '加载中...' }}</text>
      <text class="uid">{{ platformIdLabel(item.anchor?.platform || 'douyin', item.anchor?.platformUid || '') }}</text>
    </view>
    <view class="right">
      <view v-if="isLive(item.anchor?.liveState)" class="live-tag">
        <view class="live-dot" />
        <text>直播中</text>
      </view>
      <text v-else class="offline-tag">未开播</text>
      <switch
        v-if="showSwitch"
        :checked="item.enabled"
        color="#16a34a"
        @tap.stop
        @change="$emit('toggle', item._id, ($event as any).detail.value)"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.anchor-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}
.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #e2e8f0;
  margin-right: 20rpx;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #0f172a;
}
.uid {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 6rpx;
}
.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12rpx;
}
.live-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #16a34a;
  font-size: 24rpx;
  font-weight: 600;
}
.live-dot {
  width: 12rpx;
  height: 12rpx;
  background: #16a34a;
  border-radius: 50%;
}
.offline-tag {
  color: #94a3b8;
  font-size: 24rpx;
}
</style>
