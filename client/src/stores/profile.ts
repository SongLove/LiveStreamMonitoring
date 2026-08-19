import { defineStore } from 'pinia'
import { configApi, userApi } from '@/api'
import type { AppConfig, UserProfile } from '@/types/api'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null as UserProfile | null,
    loading: false,
  }),
  getters: {
    quotaBalance: (s) => s.profile?.quota.balance ?? 0,
    quotaMax: (s) => s.profile?.quota.maxBalance ?? 200,
    notifyEnabled: (s) => s.profile?.settings.notifyEnabled ?? true,
    hasAuthIssue: (s) => {
      const auth = s.profile?.templateAuth ?? {}
      return Object.values(auth).some((v) => v === 'reject' || v === 'unknown')
    },
  },
  actions: {
    async fetchProfile() {
      this.loading = true
      try {
        this.profile = await userApi.profile()
      } finally {
        this.loading = false
      }
    },
    async updateSettings(partial: Partial<UserProfile['settings']>) {
      const settings = await userApi.updateSettings(partial)
      if (this.profile) this.profile.settings = settings
    },
  },
})

export const useAppConfigStore = defineStore('appConfig', {
  state: () => ({
    config: null as AppConfig | null,
  }),
  getters: {
    liveNotifyTemplateId: (s) => s.config?.templates.liveNotify ?? '',
  },
  actions: {
    async fetchConfig() {
      this.config = await configApi.app()
    },
  },
})
