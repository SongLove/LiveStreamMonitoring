<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useAppConfigStore } from '@/stores/profile'
import { useLayoutStore } from '@/stores/layout'
import { trackEvent } from '@/utils/analytics'

onLaunch(async () => {
  useLayoutStore().init()
  trackEvent('app_open')
  const auth = useAuthStore()
  const config = useAppConfigStore()
  if (auth.isLoggedIn) {
    try {
      await config.fetchConfig()
    } catch {
      // config optional on launch
    }
  }
})
</script>

<style lang="scss">
@import './styles/theme.scss';

page {
  background: $page-bg;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
  color: $text-primary;
}
</style>
