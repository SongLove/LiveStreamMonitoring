export type Platform = 'bilibili' | 'douyin'
export type AnchorLiveState = 'offline' | 'pending_confirm' | 'live'
export type UserStatus = 'active' | 'banned' | 'deleting'
export type TemplateAuthStatus = 'accept' | 'reject' | 'unknown'
export type NotifyLogState = 'pending' | 'skipped' | 'sent' | 'failed' | 'success'
export type LiveSessionStatus = 'live' | 'ended'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

export interface UserSettings {
  notifyEnabled: boolean
  dndEnabled: boolean
  dndStart: string
  dndEnd: string
  studentMode: boolean
  largeAccountOnly: boolean
  cooldownMinutes: number
}

export interface UserProfile {
  id: string
  nickname: string
  avatarUrl: string
  status: UserStatus
  settings: UserSettings
  templateAuth: Record<string, TemplateAuthStatus>
  lastActiveAt: string
  quota: { balance: number; maxBalance: number }
}

export interface Anchor {
  _id: string
  platform: Platform
  platformUid: string
  roomId: string
  nickname: string
  avatarUrl: string
  profileUrl: string
  liveTitle: string
  coverUrl: string
  liveState: AnchorLiveState
  followerCount: number
  pollTier: number
  lastPolledAt: string | null
  subscriberCount: number
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  _id: string
  userId: string
  anchorId: string
  enabled: boolean
  categoryIds: string[]
  remark: string
  sortOrder: number
  deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface SubscriptionView extends Subscription {
  anchor?: Anchor
}

export interface Category {
  _id: string
  userId: string
  name: string
  color: string
  icon: string
  sortOrder: number
  deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface NotifyLog {
  _id: string
  userId: string
  sessionId: string
  anchorId: string
  templateId: string
  state: NotifyLogState
  skipReason: string
  wxMsgId: string
  finalStatus: string
  payload: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface LiveSession {
  _id: string
  anchorId: string
  sessionKey: string
  platform: string
  startedAt: string
  endedAt: string | null
  status: LiveSessionStatus
  title: string
  coverUrl: string
  createdAt: string
  updatedAt: string
}

export interface AppConfig {
  templates: { liveNotify?: string }
  features: { studentMode: boolean; largeAccountOnly: boolean }
}

export const NOTIFY_SKIP_LABELS: Record<string, string> = {
  subscription_disabled: '该主播提醒已关闭',
  user_banned: '账号受限',
  notify_disabled: '总提醒已关闭',
  dnd: '免打扰时段',
  student_mode: '学生党模式拦截',
  large_account_only: '仅大号模式拦截',
  cooldown: '冷却期内',
  duplicate: '重复推送',
  template_unauthorized: '订阅未授权',
  quota_insufficient: '推送次数不足',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  douyin: '抖音',
  bilibili: '哔哩哔哩',
}
