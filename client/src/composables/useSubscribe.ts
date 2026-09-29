import { ref } from 'vue'
import { useAppConfigStore, useProfileStore } from '@/stores/profile'
import { quotaApi } from '@/api'
import { trackEvent } from '@/utils/analytics'
import { interpretSubscribeResult, subscribeFailMessage } from './subscribe-result'

export function useSubscribeMessage() {
  const appConfig = useAppConfigStore()
  const profileStore = useProfileStore()

  function requestSubscribe() {
    const tmplId = String(appConfig.liveNotifyTemplateId || '')
    if (!tmplId) {
      uni.showToast({ title: '模板未配置', icon: 'none' })
      return
    }

    // 必须在点击回调里同步调用，包进 async/await 后微信不会弹订阅窗
    uni.requestSubscribeMessage({
      tmplIds: [tmplId],
      success: (res) => {
        void finish(interpretSubscribeResult(tmplId, res as unknown as Record<string, unknown>, false))
      },
      fail: (err) => {
        void finish(interpretSubscribeResult(tmplId, err as unknown as Record<string, unknown>, true))
      },
    })
  }

  async function finish(outcome: ReturnType<typeof interpretSubscribeResult>) {
    trackEvent('auth_button_click')
    trackEvent('auth_dialog_complete')
    if (outcome.kind === 'fail') {
      uni.showToast({
        title: subscribeFailMessage(outcome.errMsg, outcome.errCode),
        icon: 'none',
        duration: 3000,
      })
      return
    }

    const status = outcome.kind === 'accept' ? 'accept' : outcome.kind === 'reject' ? 'reject' : ''

    if (status === 'reject') {
      uni.showToast({ title: '未授权，请在弹窗中点允许', icon: 'none' })
      await quotaApi.refresh()
      await profileStore.fetchProfile()
      return
    }

    await quotaApi.refresh()
    await profileStore.fetchProfile()
    trackEvent('auth_refresh_done')
    if (status === 'accept') {
      uni.showToast({
        title: '已授权，到账以微信回调为准',
        icon: 'none',
        duration: 2500,
      })
    } else {
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
