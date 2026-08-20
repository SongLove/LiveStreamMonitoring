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
      if (this.profile) {
        this.profile.settings = settings
      }
    },
    /** 用 diagnose 结果刷新额度与授权镜像（Swagger 无 clear-cache 接口时的替代） */
    mergeDiagnose(data: { templateAuth: UserProfile['templateAuth']; quota: UserProfile['quota']; notifyEnabled?: boolean }) {
      if (!this.profile) return
      this.profile.templateAuth = data.templateAuth
      this.profile.quota = data.quota
      if (data.notifyEnabled !== undefined) {
        this.profile.settings.notifyEnabled = data.notifyEnabled
      }
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
