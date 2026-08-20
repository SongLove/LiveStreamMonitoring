import { defineStore } from 'pinia'
import { initLayoutMetrics, layoutCssVars, type LayoutMetrics } from '@/utils/layout'

export const useLayoutStore = defineStore('layout', {
  state: (): LayoutMetrics & { ready: boolean } => ({
    ready: false,
    statusBarHeight: 44,
    navBarHeight: 88,
    navContentHeight: 44,
    navPaddingRight: 96,
    safeAreaBottom: 34,
    tabBarHeight: 50,
    pageBottomWithTab: 96,
    pageBottom: 46,
  }),
  getters: {
    cssVars(state): Record<string, string> {
      return layoutCssVars(state)
    },
  },
  actions: {
    init() {
      const m = initLayoutMetrics()
      Object.assign(this, m, { ready: true })
    },
  },
})
