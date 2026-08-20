/**
 * Client API — 与 Server Swagger 对齐
 * 文档: http://localhost:4000/docs  OpenAPI: /docs/json
 * Base: VITE_API_BASE_URL → http://localhost:4000/api/v1
 */
import { del, get, patch, post, put } from '@/utils/request'
import type {
  Anchor,
  AnchorPoolResponse,
  AppConfig,
  Category,
  DiagnoseAuthResponse,
  LiveSession,
  LoginResponse,
  NotifyLog,
  NotifyTestResponse,
  Platform,
  QuotaResponse,
  QuotaSnapshot,
  Subscription,
  UserProfile,
  UserSettings,
} from '@/types/api'

/** POST /api/v1/auth/login */
export const authApi = {
  login(code: string) {
    return post<LoginResponse>('/auth/login', { code }, false)
  },
}

/** GET /api/v1/user/profile · PUT /api/v1/user/settings */
export const userApi = {
  profile() {
    return get<UserProfile>('/user/profile')
  },
  updateSettings(settings: Partial<UserSettings>) {
    return put<UserSettings>('/user/settings', settings as Record<string, unknown>)
  },
}

/** GET search · POST resolve · GET pool · GET :id */
export const anchorApi = {
  search(platform: Platform, q: string) {
    return get<Anchor[]>('/anchors/search', { platform, q })
  },
  resolve(platform: Platform, input: string) {
    return post<Anchor>('/anchors/resolve', { platform, input })
  },
  pool() {
    return get<AnchorPoolResponse>('/anchors/pool')
  },
  detail(id: string) {
    return get<Anchor>(`/anchors/${id}`)
  },
}

/** /api/v1/subscriptions* */
export const subscriptionApi = {
  list() {
    return get<Subscription[]>('/subscriptions')
  },
  add(anchorId: string, categoryIds?: string[]) {
    return post<Subscription>('/subscriptions', { anchorId, categoryIds })
  },
  update(
    id: string,
    data: Partial<Pick<Subscription, 'enabled' | 'remark' | 'categoryIds' | 'sortOrder'>>,
  ) {
    return patch<Subscription>(`/subscriptions/${id}`, data as Record<string, unknown>)
  },
  remove(id: string) {
    return del<{ ok: boolean }>(`/subscriptions/${id}`)
  },
  batch(ids: string[], data: { enabled?: boolean; categoryIds?: string[] }) {
    return post<{ ok: boolean }>('/subscriptions/batch', { ids, ...data })
  },
}

/** /api/v1/categories* */
export const categoryApi = {
  list() {
    return get<Category[]>('/categories')
  },
  create(data: { name: string; color?: string; icon?: string }) {
    return post<Category>('/categories', data)
  },
  update(id: string, data: { name?: string; color?: string; icon?: string }) {
    return patch<Category>(`/categories/${id}`, data)
  },
  remove(id: string) {
    return del<{ ok: boolean }>(`/categories/${id}`)
  },
  assignSubscriptions(id: string, subscriptionIds: string[]) {
    return post<{ ok: boolean }>(`/categories/${id}/subscriptions`, { subscriptionIds })
  },
}

/** GET /api/v1/quota · POST refresh（grant 禁止 Client 调用） */
export const quotaApi = {
  get() {
    return get<QuotaResponse>('/quota')
  },
  refresh() {
    return post<QuotaSnapshot>('/quota/refresh')
  },
}

/** GET logs · POST test · GET diagnose/auth · GET help/faq · GET config/app */
export const notifyApi = {
  logs(page = 1, pageSize = 20) {
    return get<{ items: NotifyLog[]; total: number; page: number; pageSize: number }>(
      '/notify/logs',
      { page, pageSize },
    )
  },
  test(message?: string) {
    return post<NotifyTestResponse>('/notify/test', { message })
  },
}

export const diagnoseApi = {
  auth() {
    return get<DiagnoseAuthResponse>('/diagnose/auth')
  },
}

export const liveApi = {
  sessions(page = 1, pageSize = 20, query?: { platform?: string; anchorId?: string }) {
    return get<{ items: LiveSession[]; total: number; page: number; pageSize: number; userId: string }>(
      '/live/sessions',
      { page, pageSize, ...query },
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
