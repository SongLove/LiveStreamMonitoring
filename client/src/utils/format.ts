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

export function platformIdLabel(platform: string, uid: string) {
  return platform === 'douyin' ? `抖音号: ${uid}` : `UID: ${uid}`
}

export function clearLocalCache() {
  const token = uni.getStorageSync('accessToken')
  uni.clearStorageSync()
  if (token) uni.setStorageSync('accessToken', token)
}
