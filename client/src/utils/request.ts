import type { ApiResponse } from '@/types/api'
import { BUSINESS_ERROR_LABELS } from '@/types/api'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || ''

function getToken(): string {
  return uni.getStorageSync('accessToken') || ''
}

export class ApiError extends Error {
  code: number
  traceId?: string
  data?: unknown

  constructor(message: string, code: number, traceId?: string, data?: unknown) {
    super(message)
    this.code = code
    this.traceId = traceId
    this.data = data
  }

  get displayMessage(): string {
    return BUSINESS_ERROR_LABELS[this.code] || this.message
  }
}

function parseBody<T>(res: UniApp.RequestSuccessCallbackResult): ApiResponse<T> {
  if (typeof res.data === 'string') {
    try {
      return JSON.parse(res.data) as ApiResponse<T>
    } catch {
      throw new ApiError('响应解析失败', -1)
    }
  }
  return res.data as ApiResponse<T>
}

export async function request<T>(
  options: UniApp.RequestOptions & { auth?: boolean },
): Promise<T> {
  const { auth = true, ...rest } = options
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.header as Record<string, string>),
  }
  if (auth) {
    const token = getToken()
    if (token) header.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    uni.request({
      ...rest,
      url: `${BASE_URL}${rest.url}`,
      header,
      success: (res) => {
        let body: ApiResponse<T>
        try {
          body = parseBody<T>(res)
        } catch (e) {
          reject(e)
          return
        }

        const httpOk = res.statusCode >= 200 && res.statusCode < 300
        if (!httpOk && (!body || body.code === undefined)) {
          reject(new ApiError(`HTTP ${res.statusCode}`, res.statusCode))
          return
        }

        if (res.statusCode === 401 || body?.code === 401) {
          uni.removeStorageSync('accessToken')
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new ApiError(body?.message || '未登录', 401, body?.traceId))
          return
        }

        if (!body || body.code !== 0) {
          reject(
            new ApiError(
              body?.message || '请求失败',
              body?.code ?? res.statusCode,
              body?.traceId,
              body?.data,
            ),
          )
          return
        }

        if (body.traceId && import.meta.env.DEV) {
          console.info('[api]', rest.method || 'GET', rest.url, body.traceId)
        }
        resolve(body.data)
      },
      fail: (err) => reject(new ApiError(err.errMsg || '网络错误', -1)),
    })
  })
}

export function get<T>(url: string, data?: Record<string, unknown>, auth = true) {
  return request<T>({ url, method: 'GET', data, auth })
}

export function post<T>(url: string, data?: Record<string, unknown>, auth = true) {
  return request<T>({ url, method: 'POST', data, auth })
}

export function put<T>(url: string, data?: Record<string, unknown>, auth = true) {
  return request<T>({ url, method: 'PUT', data, auth })
}

export function patch<T>(url: string, data?: Record<string, unknown>, auth = true) {
  return request<T>({ url, method: 'PATCH' as UniApp.RequestOptions['method'], data, auth })
}

export function del<T>(url: string, auth = true) {
  return request<T>({ url, method: 'DELETE', auth })
}
