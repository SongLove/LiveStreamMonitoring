<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/subscription'

const categoryStore = useCategoryStore()
const newName = ref('')

async function load() {
  await categoryStore.fetchCategories()
}

async function create() {
  if (!newName.value.trim()) return
  await categoryStore.createCategory(newName.value.trim())
  newName.value = ''
  uni.showToast({ title: '已创建', icon: 'success' })
}

async function remove(id: string, name: string) {
  uni.showModal({
    title: '删除分类',
    content: `删除「${name}」后，关联主播将回到未分类，不会取消监听`,
    success: async (res) => {
      if (res.confirm) {
        await categoryStore.removeCategory(id)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <view class="page-wrap">
    <view class="section-card">
      <text class="hint">系统视图「全部」「未分类」不可删除</text>
      <view v-for="cat in categoryStore.categories" :key="cat._id" class="cat-row">
        <view class="dot" :style="{ background: cat.color || '#22c55e' }" />
        <text class="name">{{ cat.name }}</text>
        <text class="del" @tap="remove(cat._id, cat.name)">删除</text>
      </view>
    </view>

    <view class="section-card create">
      <input v-model="newName" class="input" placeholder="新分类名称" maxlength="20" />
      <button class="mini-btn" @tap="create">创建</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hint {
  display: block;
  font-size: 24rpx;
  color: #94a3b8;
  margin-bottom: 16rpx;
}
.cat-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}
.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}
.name {
  flex: 1;
  font-size: 30rpx;
}
.del {
  color: #dc2626;
  font-size: 26rpx;
}
.create {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.input {
  flex: 1;
  background: #f8fafc;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
}
</style>
