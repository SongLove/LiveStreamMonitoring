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
    async login() {
      const { code } = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({ provider: 'weixin', success: resolve, fail: reject })
      })
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
