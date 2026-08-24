<script setup lang="ts">
import { ref } from 'vue'
import { useSubscribeMessage } from '@/composables/useSubscribe'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()
const { requestSubscribe } = useSubscribeMessage()
const loading = ref(false)

defineProps<{ showMasterSwitch?: boolean }>()
const emit = defineEmits<{ 'update:notifyEnabled': [v: boolean] }>()

async function onIncrease() {
  if (loading.value) return
  loading.value = true
  try {
    await requestSubscribe()
  } finally {
    loading.value = false
  }
}

function goFix() {
  uni.navigateTo({ url: '/pages/help/index' })
}
</script>

<template>
  <view class="quota-card section-card">
    <view class="head">
      <view class="head-left">
        <text class="bell">🔔</text>
        <view>
          <text class="title">实时推送</text>
          <text class="sub">开播第一时间通知您</text>
        </view>
      </view>
      <switch
        v-if="showMasterSwitch"
        :checked="profileStore.notifyEnabled"
        color="#16a34a"
        @change="emit('update:notifyEnabled', ($event as any).detail.value)"
      />
    </view>

    <view class="quota-num-wrap">
      <text class="quota-label">剩余通知次数（上限{{ profileStore.quotaMax }}）</text>
      <text class="quota-num">{{ profileStore.quotaBalance }}</text>
    </view>

    <view v-if="profileStore.hasAuthIssue" class="warn" @tap="goFix">
      <text class="warn-title">⚠️ 部分通知权限未授权</text>
      <text class="warn-sub">开播提醒 未授权，点击修复 ›</text>
    </view>

    <button class="btn-primary increase-btn" :loading="loading" @tap="onIncrease">
      + 增加推送次数
    </button>
  </view>
</template>

<style lang="scss" scoped>
.quota-card {
  margin-top: 8rpx;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}
.head-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.bell {
  font-size: 40rpx;
}
.title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
}
.sub {
  font-size: 24rpx;
  color: #94a3b8;
}
.quota-num-wrap {
  text-align: center;
  margin: 24rpx 0 32rpx;
}
.quota-label {
  display: block;
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 8rpx;
}
.quota-num {
  font-size: 96rpx;
  font-weight: 800;
  color: #16a34a;
  line-height: 1;
}
.warn {
  background: #fff7ed;
  border: 1rpx solid #fed7aa;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}
.warn-title {
  display: block;
  font-size: 26rpx;
  color: #c2410c;
  font-weight: 600;
}
.warn-sub {
  font-size: 24rpx;
  color: #ea580c;
  margin-top: 8rpx;
}
.increase-btn {
  width: 100%;
}
</style>
