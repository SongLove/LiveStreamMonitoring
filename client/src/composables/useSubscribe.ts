import { ref } from 'vue'
import { useAppConfigStore, useProfileStore } from '@/stores/profile'
import { quotaApi } from '@/api'
import { trackEvent } from '@/utils/analytics'

export function useSubscribeMessage() {
  const appConfig = useAppConfigStore()
  const profileStore = useProfileStore()

  async function requestSubscribe() {
    trackEvent('auth_button_click')
    const tmplId = appConfig.liveNotifyTemplateId
    if (!tmplId) {
      uni.showToast({ title: '模板未配置', icon: 'none' })
      return
    }
    await new Promise<void>((resolve) => {
      uni.requestSubscribeMessage({
        tmplIds: [tmplId],
        complete: () => resolve(),
      })
    })
    trackEvent('auth_dialog_complete')
    await quotaApi.refresh()
    await profileStore.fetchProfile()
    trackEvent('auth_refresh_done')
    uni.showToast({ title: '已刷新额度', icon: 'success' })
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
