import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: '' as string,
    userId: '' as string,
    nickname: '' as string,
    avatarUrl: '' as string,
  }),
  getters: {
    isLoggedIn: (s) => !!s.accessToken,
  },
  actions: {
    /** POST /api/v1/auth/login — 返回 { accessToken, user: { id, ... } } */
    async login(code: string) {
      const data = await authApi.login(code)
      this.accessToken = data.accessToken
      this.userId = data.user.id
      this.nickname = data.user.nickname
      this.avatarUrl = data.user.avatarUrl
      uni.setStorageSync('accessToken', data.accessToken)
      return data
    },
    logout() {
      this.accessToken = ''
      this.userId = ''
      this.nickname = ''
      this.avatarUrl = ''
      uni.removeStorageSync('accessToken')
    },
  },
  persist: {
    paths: ['accessToken', 'userId', 'nickname', 'avatarUrl'],
  },
})
