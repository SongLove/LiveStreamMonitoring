export type SubscribeOutcome =
  | { kind: 'accept' }
  | { kind: 'reject' }
  | { kind: 'fail'; errMsg: string; errCode?: number }
  | { kind: 'unknown' }

/** 微信 fail 不能当成用户拒绝，否则手势/模板错误都会显示「未授权」。 */
export function interpretSubscribeResult(
  tmplId: string,
  res: Record<string, unknown> | undefined | null,
  failed: boolean,
): SubscribeOutcome {
  if (failed) {
    const code = Number(res?.errCode)
    return {
      kind: 'fail',
      errMsg: String(res?.errMsg || ''),
      errCode: Number.isFinite(code) && code !== 0 ? code : undefined,
    }
  }
  const status = String(res?.[tmplId] ?? '').toLowerCase()
  if (status === 'accept' || status === 'acceptwithforcepush') return { kind: 'accept' }
  if (status === 'reject' || status === 'ban' || status === 'filter') return { kind: 'reject' }
  return { kind: 'unknown' }
}

export function subscribeFailMessage(errMsg: string, errCode?: number): string {
  const m = errMsg.toLowerCase()
  const text = m.includes('tap gesture') || m.includes('bindtap')
    ? '请直接点击按钮授权'
    : m.includes('main switch')
      ? '请先打开订阅消息总开关'
      : m.includes('template')
        ? '订阅模板无效'
        : m.includes('cancel')
          ? '已取消，次数不会增加'
          : '授权未完成，次数不会增加'
  return errCode ? `${text} ${errCode}` : text
}
