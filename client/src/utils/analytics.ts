const EVENTS = [
  'app_open',
  'login_success',
  'search_anchor',
  'resolve_success',
  'follow_success',
  'category_create',
  'category_delete',
  'recommend_click',
  'recommend_follow',
  'auth_button_click',
  'auth_dialog_complete',
  'auth_refresh_done',
  'help_entry',
  'test_push_click',
  'notify_card_open',
] as const

export type AnalyticsEvent = (typeof EVENTS)[number]

/** 轻量埋点：优先 wx.reportAnalytics，降级 console */
export function trackEvent(name: AnalyticsEvent, payload?: Record<string, string | number | boolean>) {
  const data = payload ?? {}
  try {
    if (typeof wx !== 'undefined' && wx.reportAnalytics) {
      wx.reportAnalytics(name, data)
    }
  } catch {
    // ignore
  }
  console.info('[analytics]', name, data)
}
