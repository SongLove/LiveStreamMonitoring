import type { ApiResponse } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

function getToken(): string {
  return uni.getStorageSync('accessToken') || ''
}

export class ApiError extends Error {
  code: number
  traceId?: string

  constructor(message: string, code: number, traceId?: string) {
    super(message)
    this.code = code
    this.traceId = traceId
  }
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
        const body = res.data as ApiResponse<T>
        if (res.statusCode === 401 || body?.code === 401) {
          uni.removeStorageSync('accessToken')
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new ApiError(body?.message || '未登录', 401, body?.traceId))
          return
        }
        if (!body || body.code !== 0) {
          reject(
            new ApiError(body?.message || '请求失败', body?.code ?? res.statusCode, body?.traceId),
          )
          return
        }
        if (body.traceId) {
          console.info('[api]', rest.url, body.traceId)
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
