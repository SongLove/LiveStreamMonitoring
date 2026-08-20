<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageShell from '@/components/PageShell.vue'
import { useAuthStore } from '@/stores/auth'
import { diagnoseApi, helpApi, notifyApi, quotaApi } from '@/api'
import { useProfileStore } from '@/stores/profile'
import { ApiError } from '@/utils/request'
import { clearLocalCache } from '@/utils/format'
import { trackEvent } from '@/utils/analytics'
import { hideNativeTabBar } from '@/utils/tabbar'
import AppTabBar from '@/components/AppTabBar.vue'

const auth = useAuthStore()
const profileStore = useProfileStore()
const faqItems = ref<Array<{ q: string; a: string }>>([])
const loading = ref(false)

const defaultFaq = [
  { q: '为什么不能批量增加推送次数？', a: '微信一次性订阅每次授权只能累积对应模板的一次下发权限，需多次点击授权。' },
  { q: '如果没有收到推送该怎么办？', a: '请先检查订阅权限、剩余次数与免打扰设置，并查看推送记录中的跳过原因。' },
  { q: '为什么状态有延迟？', a: '列表展示的是服务端最近一次探测结果，非实时流，请关注更新时间。' },
  { q: '如何恢复拒收权限？', a: '前往微信 → 设置 → 通知 → 小程序通知，重新开启对应模板。' },
]

async function loadFaq() {
  try {
    const res = await helpApi.faq()
    faqItems.value = res.items?.length ? res.items : defaultFaq
  } catch {
    faqItems.value = defaultFaq
  }
}

function formatDiagnose(res: Awaited<ReturnType<typeof diagnoseApi.auth>>) {
  const lines = [
    `账号: ${res.status}`,
    `总开关: ${res.notifyEnabled ? '开' : '关'}`,
    `额度: ${res.quota.balance}/${res.quota.maxBalance}`,
  ]
  const entries = Object.entries(res.templateAuth || {})
  if (entries.length) {
    lines.push('模板授权:')
    entries.forEach(([k, v]) => lines.push(`  ${k}: ${v}`))
  } else {
    lines.push('模板授权: 暂无记录（请先在小程序内授权）')
  }
  return lines.join('\n')
}

async function checkAuth() {
  loading.value = true
  try {
    const res = await diagnoseApi.auth()
    profileStore.mergeDiagnose(res)
    uni.showModal({ title: '订阅权限', content: formatDiagnose(res), showCancel: false })
  } catch (e: unknown) {
    const msg = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '检查失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function sendTest() {
  trackEvent('test_push_click')
  uni.showModal({
    title: '测试推送',
    content: '测试推送会走真实微信下发并消耗 1 次额度。不代表真实开播提醒。',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const r = await notifyApi.test('测试推送')
        if (r.ok) uni.showToast({ title: '已发送', icon: 'success' })
        else if (r.reason === 'quota_insufficient') uni.showToast({ title: '推送次数不足', icon: 'none' })
        else uni.showToast({ title: r.result?.errmsg || '发送失败', icon: 'none' })
        await profileStore.fetchProfile()
      } catch (e: unknown) {
        const msg = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '失败'
        uni.showToast({ title: msg, icon: 'none' })
      }
    },
  })
}

async function clearNotifyCache() {
  try {
    await quotaApi.refresh()
    const diag = await diagnoseApi.auth()
    profileStore.mergeDiagnose(diag)
    await profileStore.fetchProfile()
    uni.showToast({ title: '已刷新授权与额度', icon: 'success' })
  } catch (e: unknown) {
    const msg = e instanceof ApiError ? e.displayMessage : e instanceof Error ? e.message : '失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

function clearLocal() {
  uni.showModal({
    title: '清除本地缓存',
    content: '仅清理本设备数据，云端监听不受影响',
    success: (res) => {
      if (res.confirm) {
        clearLocalCache()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    },
  })
}

function showFaq(item: { q: string; a: string }) {
  uni.showModal({ title: item.q, content: item.a, showCancel: false })
}

onShow(() => {
  hideNativeTabBar()
  if (!auth.isLoggedIn) uni.reLaunch({ url: '/pages/login/index' })
})
onMounted(loadFaq)
</script>

<template>
  <PageShell with-tab-bar>
    <template #nav>
      <text class="nav-title">帮助中心</text>
    </template>
    <view class="page-wrap">
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">【点击检查】自助诊断工具</text>
          <text class="badge-pill">4项功能</text>
        </view>

        <view class="tool" @tap="checkAuth">
          <text class="tool-icon">🛡</text>
          <view class="tool-text">
            <text class="tool-title">检查订阅权限</text>
            <text class="tool-desc">GET /diagnose/auth</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="tool" @tap="sendTest">
          <text class="tool-icon">🔔</text>
          <view class="tool-text">
            <text class="tool-title">发送测试推送</text>
            <text class="tool-desc">POST /notify/test</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="tool" @tap="clearNotifyCache">
          <text class="tool-icon">🧹</text>
          <view class="tool-text">
            <text class="tool-title">清除通知缓存</text>
            <text class="tool-desc">刷新额度与授权镜像</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="tool" @tap="clearLocal">
          <text class="tool-icon">🔄</text>
          <view class="tool-text">
            <text class="tool-title">清除本地缓存</text>
            <text class="tool-desc">清理本地数据解决小程序显示异常</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="section-card">
        <view class="section-header">
          <text class="section-title">常见问题</text>
          <text class="badge-pill">{{ faqItems.length }}个问题</text>
        </view>
        <view v-for="(item, i) in faqItems" :key="i" class="faq" @tap="showFaq(item)">
          <text class="q">Q</text>
          <text class="faq-q">{{ item.q }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
    <template #footer>
      <AppTabBar current="help" />
    </template>
  </PageShell>
</template>

<style lang="scss" scoped>
.tool,
.faq {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}
.tool-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}
.tool-text {
  flex: 1;
}
.tool-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}
.tool-desc {
  font-size: 24rpx;
  color: #94a3b8;
}
.faq {
  gap: 12rpx;
}
.q {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 700;
}
.faq-q {
  flex: 1;
  font-size: 28rpx;
}
.arrow {
  color: #cbd5e1;
}
</style>
