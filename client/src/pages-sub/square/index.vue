<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { anchorApi } from '@/api'

const message = ref('')
const sets = ref<unknown[]>([])

async function load() {
  const res = await anchorApi.pool()
  message.value = res.message || ''
  sets.value = res.sets || []
}

function goAddAnchor() {
  uni.navigateTo({ url: '/pages-sub/anchor/add' })
}

onMounted(load)
</script>

<template>
  <view class="page-wrap">
    <text class="page-title">主播广场</text>
    <view v-if="!sets.length" class="section-card empty-wrap">
      <text>{{ message || '推荐内容筹备中，请通过添加主播搜索关注' }}</text>
      <button class="btn-primary" style="margin-top: 24rpx" @tap="goAddAnchor">
        添加主播
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-title {
  font-size: 48rpx;
  font-weight: 800;
  margin-bottom: 24rpx;
}
</style>
