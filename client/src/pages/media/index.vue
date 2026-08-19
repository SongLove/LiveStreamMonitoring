<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import AppTabBar from '@/components/AppTabBar.vue'
import AnchorListItem from '@/components/AnchorListItem.vue'
import { useAuthStore } from '@/stores/auth'
import { useCategoryStore, useSubscriptionStore } from '@/stores/subscription'

const auth = useAuthStore()
const categoryStore = useCategoryStore()
const subStore = useSubscriptionStore()

const activeCategory = ref('')

const diyCategories = computed(() => categoryStore.categories)
const list = computed(() => {
  if (!activeCategory.value) return subStore.liveFirst
  return subStore.filtered(activeCategory.value)
})

async function load() {
  await Promise.all([subStore.fetchAll(), categoryStore.fetchCategories()])
  if (!activeCategory.value && diyCategories.value.length) {
    activeCategory.value = diyCategories.value[0]._id
  }
}

async function onToggle(id: string, enabled: boolean) {
  await subStore.toggleEnabled(id, enabled)
}

function goDetail(anchorId: string) {
  uni.navigateTo({ url: `/pages-sub/anchor/detail?id=${anchorId}` })
}

function goCategoryManage() {
  uni.navigateTo({ url: '/pages-sub/category/manage' })
}

onShow(() => {
  if (!auth.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }
  load()
})
onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})
onMounted(load)
</script>

<template>
  <view class="page-wrap">
    <view class="header">
      <text class="page-title">传媒监控</text>
      <text class="manage" @tap="goCategoryManage">📁</text>
    </view>

    <view class="seg-tabs">
      <view
        v-for="cat in diyCategories"
        :key="cat._id"
        class="seg"
        :class="{ active: activeCategory === cat._id }"
        @tap="activeCategory = cat._id"
      >
        {{ cat.name }}
      </view>
      <view v-if="!diyCategories.length" class="seg hint" @tap="goCategoryManage">+ 创建分类</view>
    </view>

    <view class="section-card">
      <view class="section-header">
        <text class="section-title">主播列表</text>
        <text class="badge-pill">{{ list.length }}位主播</text>
      </view>

      <view v-if="!list.length" class="empty-wrap">该分类暂无主播，去归类吧</view>
      <AnchorListItem
        v-for="item in list"
        :key="item._id"
        :item="item"
        show-switch
        @tap="goDetail"
        @toggle="onToggle"
      />
    </view>

    <AppTabBar current="media" />
  </view>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.manage {
  font-size: 40rpx;
}
.seg-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  background: #e2e8f0;
  border-radius: 999rpx;
  padding: 8rpx;
}
.seg {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  color: #64748b;
  &.active {
    background: #fff;
    color: #0f172a;
    font-weight: 600;
  }
  &.hint {
    color: #16a34a;
  }
}
</style>
