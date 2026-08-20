#!/usr/bin/env node
/**
 * 对照 Swagger 验证 Client 所需 /api/v1 接口
 * 用法: node scripts/verify-api.mjs [baseUrl]
 * 默认: http://localhost:4000
 */
import http from 'node:http'

const HOST = process.argv[2] || 'http://localhost:4000'
const base = HOST.replace(/\/$/, '')

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const u = new URL(path, base)
    const opt = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (token) opt.headers.Authorization = `Bearer ${token}`
    if (data) opt.headers['Content-Length'] = Buffer.byteLength(data)
    const r = http.request(opt, (res) => {
      let b = ''
      res.on('data', (c) => (b += c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) })
        } catch {
          reject(new Error(`Invalid JSON: ${path}`))
        }
      })
    })
    r.on('error', reject)
    if (data) r.write(data)
    r.end()
  })
}

function ok(name, res) {
  if (res.body?.code !== 0) {
    console.error(`FAIL ${name}`, res.body)
    return false
  }
  console.log(`OK   ${name}`)
  return true
}

async function main() {
  console.log(`Verify Client API against ${base}/docs\n`)

  const login = await req('POST', '/api/v1/auth/login', { code: 'test' })
  if (!ok('POST /api/v1/auth/login', login)) process.exit(1)
  const token = login.body.data.accessToken
  if (!login.body.data.user?.id) {
    console.error('FAIL login response missing user.id (Swagger 文档写 userId，实际为 user.id)')
    process.exit(1)
  }
  console.log('OK   login.user.id present')

  const gets = [
    '/api/v1/user/profile',
    '/api/v1/config/app',
    '/api/v1/subscriptions',
    '/api/v1/categories',
    '/api/v1/quota',
    '/api/v1/diagnose/auth',
    '/api/v1/help/faq',
    '/api/v1/live/sessions?page=1&pageSize=5',
    '/api/v1/anchors/pool',
    '/api/v1/notify/logs?page=1&pageSize=5',
  ]

  for (const p of gets) {
    const res = await req('GET', p, null, token)
    if (!ok(`GET ${p.split('?')[0]}`, res)) process.exit(1)
  }

  const refresh = await req('POST', '/api/v1/quota/refresh', {}, token)
  if (!ok('POST /api/v1/quota/refresh', refresh)) process.exit(1)

  const grant = await req('POST', '/api/v1/quota/grant', {}, token)
  if (grant.body?.code === 0) {
    console.error('FAIL POST /api/v1/quota/grant should be rejected for client')
    process.exit(1)
  }
  console.log('OK   POST /api/v1/quota/grant rejected (expected)')

  console.log('\nAll Client API checks passed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
