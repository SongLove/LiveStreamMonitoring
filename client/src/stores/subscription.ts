import { defineStore } from 'pinia'
import { anchorApi, categoryApi, subscriptionApi } from '@/api'
import type { Anchor, Category, Subscription, SubscriptionView } from '@/types/api'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as Category[],
    loading: false,
  }),
  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        this.categories = await categoryApi.list()
      } finally {
        this.loading = false
      }
    },
    async createCategory(name: string, color = '#22c55e') {
      const cat = await categoryApi.create({ name, color })
      this.categories.push(cat)
      return cat
    },
    async removeCategory(id: string) {
      await categoryApi.remove(id)
      this.categories = this.categories.filter((c) => c._id !== id)
    },
  },
})

export const useSubscriptionStore = defineStore('subscription', {
  state: () => ({
    subscriptions: [] as SubscriptionView[],
    anchorMap: {} as Record<string, Anchor>,
    loading: false,
  }),
  getters: {
    liveFirst(state) {
      return [...state.subscriptions].sort((a, b) => {
        const liveA = a.anchor?.liveState === 'live' ? 0 : 1
        const liveB = b.anchor?.liveState === 'live' ? 0 : 1
        if (liveA !== liveB) return liveA - liveB
        return a.sortOrder - b.sortOrder
      })
    },
    countByCategory: (state) => (categoryId: string | null) => {
      if (categoryId === null) return state.subscriptions.length
      if (categoryId === '__uncategorized__') {
        return state.subscriptions.filter((s) => !s.categoryIds?.length).length
      }
      return state.subscriptions.filter((s) => s.categoryIds?.includes(categoryId)).length
    },
    filtered() {
      return (categoryId: string | null) => {
        let list = this.liveFirst
        if (categoryId === '__uncategorized__') {
          list = list.filter((s: SubscriptionView) => !s.categoryIds?.length)
        } else if (categoryId && categoryId !== '__all__') {
          list = list.filter((s: SubscriptionView) => s.categoryIds?.includes(categoryId))
        }
        return list
      }
    },
  },
  actions: {
    async fetchAll() {
      this.loading = true
      try {
        const subs = await subscriptionApi.list()
        const ids = [...new Set(subs.map((s) => s.anchorId))]
        const anchors = await Promise.all(
          ids.map((id) => anchorApi.detail(id).catch(() => null)),
        )
        const map: Record<string, Anchor> = {}
        anchors.forEach((a) => {
          if (a) map[a._id] = a
        })
        this.anchorMap = map
        this.subscriptions = subs.map((s) => ({ ...s, anchor: map[s.anchorId] }))
      } finally {
        this.loading = false
      }
    },
    async toggleEnabled(id: string, enabled: boolean) {
      const updated = await subscriptionApi.update(id, { enabled })
      const idx = this.subscriptions.findIndex((s) => s._id === id)
      if (idx >= 0) this.subscriptions[idx] = { ...this.subscriptions[idx], ...updated }
    },
    async updateCategories(id: string, categoryIds: string[]) {
      const updated = await subscriptionApi.update(id, { categoryIds })
      const idx = this.subscriptions.findIndex((s) => s._id === id)
      if (idx >= 0) this.subscriptions[idx] = { ...this.subscriptions[idx], ...updated }
    },
  },
})
