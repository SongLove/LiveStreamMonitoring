import assert from 'node:assert/strict'
import { interpretSubscribeResult, subscribeFailMessage } from '../src/composables/subscribe-result.ts'

const tmplId = 'HH3T_TEMPLATE'

assert.deepEqual(
  interpretSubscribeResult(tmplId, { errMsg: 'requestSubscribeMessage:ok', [tmplId]: 'accept' }, false),
  { kind: 'accept' },
)

assert.deepEqual(
  interpretSubscribeResult(tmplId, { [tmplId]: 'reject' }, false),
  { kind: 'reject' },
)

assert.equal(
  interpretSubscribeResult(
    tmplId,
    { errMsg: 'requestSubscribeMessage:fail can only be invoked by user TAP gesture' },
    true,
  ).kind,
  'fail',
)

assert.equal(
  subscribeFailMessage('requestSubscribeMessage:fail can only be invoked by user TAP gesture'),
  '请直接点击按钮授权',
)
assert.equal(
  subscribeFailMessage('requestSubscribeMessage:fail No template data return, verify the template id exist', 20001),
  '订阅模板无效 20001',
)

console.log('subscribe-result.spec ok')
