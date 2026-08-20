import { ref } from 'vue'
import { useAppConfigStore, useProfileStore } from '@/stores/profile'
import { quotaApi } from '@/api'
import { trackEvent } from '@/utils/analytics'
import { ApiError } from '@/utils/request'

export function useSubscribeMessage() {
  const appConfig = useAppConfigStore()
  const profileStore = useProfileStore()

  async function requestSubscribe() {
    trackEvent('auth_button_click')
    if (!appConfig.config) {
      await appConfig.fetchConfig()
    }
    const tmplId = appConfig.liveNotifyTemplateId
    if (!tmplId) {
      uni.showToast({ title: '模板未配置', icon: 'none' })
      return
    }

    const result = await new Promise<Record<string, string>>((resolve) => {
      let settled = false
      const done = (res: Record<string, string>) => {
        if (settled) return
        settled = true
        resolve(res)
      }
      uni.requestSubscribeMessage({
        tmplIds: [tmplId],
        success: (res) => done(res as unknown as Record<string, string>),
        fail: () => done({ [tmplId]: 'reject' }),
      })
    })

    trackEvent('auth_dialog_complete')
    const status = String(result[tmplId] || '').toLowerCase()

    // 生产：额度只靠微信服务器回调；本地无 APPID 时模拟回调到账
    if (status === 'accept' || status === 'acceptwithforcepush') {
      try {
        const mock = await quotaApi.mockSubscribeAccept(tmplId, 'accept')
        if (mock?.granted) {
          await profileStore.fetchProfile()
          trackEvent('auth_refresh_done')
          uni.showToast({ title: '已增加 1 次', icon: 'success' })
          return
        }
      } catch (e: unknown) {
        // 已配置真实微信：403 属预期，继续只读刷新等回调
        if (!(e instanceof ApiError && (e.code === 403 || e.message.includes('WECHAT_APPID')))) {
          console.warn('mock subscribe accept failed', e)
        }
      }
    } else if (status === 'reject' || status === 'ban') {
      uni.showToast({ title: '未授权，次数不会增加', icon: 'none' })
      await quotaApi.refresh()
      await profileStore.fetchProfile()
      return
    }

    // 真实微信环境：回调可能延迟；先刷新展示
    await quotaApi.refresh()
    await profileStore.fetchProfile()
    trackEvent('auth_refresh_done')
    if (status === 'accept' || status === 'acceptwithforcepush') {
      uni.showToast({
        title: '已授权，到账以微信回调为准（可稍后刷新）',
        icon: 'none',
        duration: 2500,
      })
    } else {
      // 开发者工具可能不回传 status，本地 mock 仍尝试到账
      try {
        const mock = await quotaApi.mockSubscribeAccept(tmplId, 'accept')
        if (mock?.granted) {
          await profileStore.fetchProfile()
          uni.showToast({ title: '已增加 1 次', icon: 'success' })
          return
        }
      } catch {
        /* ignore */
      }
      uni.showToast({ title: '已刷新额度', icon: 'success' })
    }
  }

  return { requestSubscribe }
}

export function useQuotaRefresh() {
  const profileStore = useProfileStore()

  async function refreshQuota() {
    await quotaApi.refresh()
    await profileStore.fetchProfile()
  }

  return { refreshQuota }
}

export function useSubmitGuard() {
  const loading = ref(false)

  async function guard<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (loading.value) return
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return { loading, guard }
}
