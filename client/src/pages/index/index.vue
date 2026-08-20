<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import AppTabBar from '@/components/AppTabBar.vue'
import PageShell from '@/components/PageShell.vue'
import AnchorListItem from '@/components/AnchorListItem.vue'
import QuotaCard from '@/components/QuotaCard.vue'
import CategoryTabs from '@/components/CategoryTabs.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore, useAppConfigStore } from '@/stores/profile'
import { useCategoryStore, useSubscriptionStore } from '@/stores/subscription'
import { ApiError } from '@/utils/request'
import { hideNativeTabBar } from '@/utils/tabbar'

const auth = useAuthStore()
const profileStore = useProfileStore()
const appConfig = useAppConfigStore()
const categoryStore = useCategoryStore()
const subStore = useSubscriptionStore()

const activeCategory = ref('__all__')
const error = ref('')

const list = computed(() => subStore.filtered(activeCategory.value))
const categoryTitle = computed(() => {
  if (activeCategory.value === '__all__') return '我的监听'
  if (activeCategory.value === '__uncategorized__') return '未分类'
  return categoryStore.categories.find((c) => c._id === activeCategory.value)?.name || '分类'
})

function countFn(id: string) {
  if (id === '__all__') return subStore.subscriptions.length
  return subStore.countByCategory(id === '__uncategorized__' ? '__uncategorized__' : id)
}

async function loadData() {
  error.value = ''
  try {
    await Promise.all([
      profileStore.fetchProfile(),
      subStore.fetchAll(),
      categoryStore.fetchCategories(),
      appConfig.fetchConfig(),
    ])
  } catch (e: unknown) {
    error.value = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '加载失败'
  }
}

async function onRefresh() {
  await loadData()
  uni.stopPullDownRefresh()
}

async function onNotifyToggle(enabled: boolean) {
  await profileStore.updateSettings({ notifyEnabled: enabled })
}

async function onItemToggle(id: string, enabled: boolean) {
  await subStore.toggleEnabled(id, enabled)
}

function goAdd() {
  uni.navigateTo({ url: '/pages-sub/anchor/add' })
}

function goDetail(anchorId: string) {
  uni.navigateTo({ url: `/pages-sub/anchor/detail?id=${anchorId}` })
}

onShow(() => {
  hideNativeTabBar()
  if (!auth.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }
  loadData()
})

onPullDownRefresh(onRefresh)
onMounted(loadData)
</script>

<template>
  <PageShell with-tab-bar>
    <template #nav>
      <text class="nav-title green">主播监控</text>
    </template>
    <template #nav-right>
      <text class="add-btn" @tap="goAdd">+</text>
    </template>
    <view class="page-wrap">
      <CategoryTabs
        :categories="categoryStore.categories"
        :active-id="activeCategory"
        :count-fn="countFn"
        @change="activeCategory = $event"
      />

      <view class="section-card">
        <view class="section-header">
          <text class="section-title">{{ categoryTitle }}</text>
          <text class="badge-pill">{{ list.length }} 个账号</text>
        </view>

        <view v-if="subStore.loading" class="empty-wrap">加载中...</view>
        <view v-else-if="error" class="empty-wrap">
          <text>{{ error }}</text>
          <button size="mini" @tap="loadData">重试</button>
        </view>
        <view v-else-if="!list.length" class="empty-wrap">
          <text>还没有监听主播</text>
          <button class="btn-primary" style="margin-top: 24rpx" @tap="goAdd">添加主播</button>
        </view>
        <AnchorListItem
          v-for="item in list"
          :key="item._id"
          :item="item"
          @tap="goDetail"
          @toggle="onItemToggle"
        />
      </view>

      <QuotaCard show-master-switch @update:notify-enabled="onNotifyToggle" />
    </view>
    <template #footer>
      <AppTabBar current="monitor" />
    </template>
  </PageShell>
</template>

<style lang="scss" scoped>
.add-btn {
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 14rpx;
  font-size: 36rpx;
  font-weight: 300;
}
</style>
