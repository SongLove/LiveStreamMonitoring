import { del, get, patch, post, put } from '@/utils/request'
import type {
  Anchor,
  AppConfig,
  Category,
  LiveSession,
  NotifyLog,
  Platform,
  Subscription,
  UserProfile,
  UserSettings,
} from '@/types/api'

export const authApi = {
  login(code: string) {
    return post<{ accessToken: string; user: { id: string; nickname: string; avatarUrl: string; status: string } }>(
      '/auth/login',
      { code },
      false,
    )
  },
}

export const userApi = {
  profile() {
    return get<UserProfile>('/user/profile')
  },
  updateSettings(settings: Partial<UserSettings>) {
    return put<UserSettings>('/user/settings', settings as Record<string, unknown>)
  },
}

export const anchorApi = {
  search(platform: Platform, q: string) {
    return get<Anchor[]>('/anchors/search', { platform, q })
  },
  resolve(platform: Platform, input: string) {
    return post<Anchor>('/anchors/resolve', { platform, input })
  },
  pool() {
    return get<{ sets: unknown[]; message?: string }>('/anchors/pool')
  },
  detail(id: string) {
    return get<Anchor>(`/anchors/${id}`)
  },
}

export const subscriptionApi = {
  list() {
    return get<Subscription[]>('/subscriptions')
  },
  add(anchorId: string, categoryIds?: string[]) {
    return post<Subscription>('/subscriptions', { anchorId, categoryIds })
  },
  update(id: string, data: Partial<Pick<Subscription, 'enabled' | 'remark' | 'categoryIds' | 'sortOrder'>>) {
    return patch<Subscription>(`/subscriptions/${id}`, data as Record<string, unknown>)
  },
  remove(id: string) {
    return del<{ ok: boolean }>(`/subscriptions/${id}`)
  },
  batch(ids: string[], data: { enabled?: boolean; categoryIds?: string[] }) {
    return post<{ ok: boolean }>('/subscriptions/batch', { ids, ...data })
  },
}

export const categoryApi = {
  list() {
    return get<Category[]>('/categories')
  },
  create(data: { name: string; color?: string; icon?: string }) {
    return post<Category>('/categories', data)
  },
  update(id: string, data: { name?: string; color?: string; icon?: string; sortOrder?: number }) {
    return patch<Category>(`/categories/${id}`, data)
  },
  remove(id: string) {
    return del<{ ok: boolean }>(`/categories/${id}`)
  },
  assignSubscriptions(id: string, subscriptionIds: string[]) {
    return post<{ ok: boolean }>(`/categories/${id}/subscriptions`, { subscriptionIds })
  },
}

export const quotaApi = {
  get() {
    return get<{ balance: number; maxBalance: number; recentLedger: unknown[] }>('/quota')
  },
  refresh() {
    return post<{ balance: number; maxBalance: number }>('/quota/refresh')
  },
}

export const notifyApi = {
  logs(page = 1, pageSize = 20) {
    return get<{ items: NotifyLog[]; total: number; page: number; pageSize: number }>(
      '/notify/logs',
      { page, pageSize },
    )
  },
  test(message?: string) {
    return post<{ ok: boolean; reason?: string; result?: { errcode: number } }>('/notify/test', { message })
  },
}

export const diagnoseApi = {
  auth() {
    return get<{
      status: string
      templateAuth: Record<string, string>
      notifyEnabled: boolean
      quota: { balance: number; maxBalance: number }
    }>('/diagnose/auth')
  },
  clearCache() {
    return post<{ ok: boolean }>('/diagnose/clear-cache')
  },
}

export const liveApi = {
  sessions(page = 1, pageSize = 20) {
    return get<{ items: LiveSession[]; total: number; page: number; pageSize: number }>(
      '/live/sessions',
      { page, pageSize },
    )
  },
}

export const helpApi = {
  faq() {
    return get<{ items: Array<{ q: string; a: string }> }>('/help/faq')
  },
}

export const configApi = {
  app() {
    return get<AppConfig>('/config/app')
  },
}
