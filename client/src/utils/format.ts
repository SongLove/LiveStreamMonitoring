import dayjs from 'dayjs'
import type { AnchorLiveState } from '@/types/api'

export function formatStatusTime(iso: string | null | undefined) {
  if (!iso) return '暂无更新'
  return dayjs(iso).format('HH:mm 更新')
}

export function liveStateLabel(state?: AnchorLiveState) {
  if (state === 'live') return '直播中'
  if (state === 'pending_confirm') return '确认中'
  return '未开播'
}

export function isLive(state?: AnchorLiveState) {
  return state === 'live' || state === 'pending_confirm'
}

export function platformIdLabel(
  platform: string,
  platformUid: string,
  roomId?: string,
) {
  // 抖音：展示用抖音号（roomId/unique_id），platformUid 是 sec_uid 稳定主键
  if (platform === 'douyin') {
    return `抖音号: ${roomId || platformUid}`
  }
  if (platform === 'kuaishou') {
    return `快手号: ${roomId || platformUid}`
  }
  return `UID: ${platformUid}`
}

export function clearLocalCache() {
  const token = uni.getStorageSync('accessToken')
  uni.clearStorageSync()
  if (token) uni.setStorageSync('accessToken', token)
}
