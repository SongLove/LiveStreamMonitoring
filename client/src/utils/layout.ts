/** 小程序安全区与自定义导航栏尺寸（px） */
export interface LayoutMetrics {
  /** 状态栏高度 */
  statusBarHeight: number
  /** 自定义导航总高度 = 状态栏 + 导航内容行 */
  navBarHeight: number
  /** 导航内容行高度（与胶囊垂直对齐，不含状态栏） */
  navContentHeight: number
  /** 导航栏右侧留白，避免与微信胶囊重叠 */
  navPaddingRight: number
  /** 底部安全区（Home Indicator） */
  safeAreaBottom: number
  /** Tab 栏内容区高度（不含 safe-bottom） */
  tabBarHeight: number
  /** 有 Tab 栏时页面底部留白 */
  pageBottomWithTab: number
  /** 无 Tab 栏时页面底部留白 */
  pageBottom: number
}

const FALLBACK: LayoutMetrics = {
  statusBarHeight: 44,
  navBarHeight: 88,
  navContentHeight: 44,
  navPaddingRight: 96,
  safeAreaBottom: 34,
  tabBarHeight: 50,
  pageBottomWithTab: 96,
  pageBottom: 46,
}

let cached: LayoutMetrics = { ...FALLBACK }

export function getLayoutMetrics(): LayoutMetrics {
  return cached
}

function readWindowMetrics() {
  // uni-app 优先 getWindowInfo；部分基础库/时机下回退 systemInfo
  try {
    if (typeof uni.getWindowInfo === 'function') {
      const w = uni.getWindowInfo()
      return {
        statusBarHeight: w.statusBarHeight ?? 0,
        windowWidth: w.windowWidth ?? 375,
        safeAreaBottom: w.safeAreaInsets?.bottom ?? 0,
      }
    }
  } catch {
    // fall through
  }
  const s = uni.getSystemInfoSync()
  const bottom =
    s.safeAreaInsets?.bottom ??
    (s.safeArea && s.screenHeight ? Math.max(0, s.screenHeight - s.safeArea.bottom) : 0)
  return {
    statusBarHeight: s.statusBarHeight ?? FALLBACK.statusBarHeight,
    windowWidth: s.windowWidth ?? 375,
    safeAreaBottom: bottom,
  }
}

/**
 * 微信小程序自定义导航栏标准算法：
 * navContentHeight = (胶囊.top - 状态栏) * 2 + 胶囊.height  → 与胶囊垂直居中
 * navBarHeight     = 状态栏 + navContentHeight             → 页面顶部总占位
 */
export function initLayoutMetrics(): LayoutMetrics {
  try {
    const { statusBarHeight: rawStatus, windowWidth, safeAreaBottom } = readWindowMetrics()
    const statusBarHeight = rawStatus > 0 ? rawStatus : FALLBACK.statusBarHeight
    const sideGap = uni.upx2px(16)
    const tabBarHeight = uni.upx2px(100)
    const pagePad = uni.upx2px(24)

    let navContentHeight = 44
    let navPaddingRight = uni.upx2px(32)

    // #ifdef MP-WEIXIN
    try {
      const menu = uni.getMenuButtonBoundingClientRect()
      if (menu && menu.width > 0 && menu.height > 0) {
        // 胶囊与状态栏之间的上下对称间距
        const gap = Math.max(0, menu.top - statusBarHeight)
        navContentHeight = menu.height + gap * 2
        // 从屏幕右缘到胶囊左缘的距离，作为右侧 padding
        navPaddingRight = Math.max(uni.upx2px(32), windowWidth - menu.left + sideGap)
      }
    } catch {
      // keep fallbacks
    }
    // #endif

    const navBarHeight = statusBarHeight + navContentHeight

    cached = {
      statusBarHeight,
      navBarHeight,
      navContentHeight,
      navPaddingRight,
      safeAreaBottom,
      tabBarHeight,
      pageBottomWithTab: tabBarHeight + safeAreaBottom + pagePad,
      pageBottom: safeAreaBottom + pagePad,
    }
  } catch {
    cached = { ...FALLBACK }
  }
  return cached
}

export function layoutCssVars(m: LayoutMetrics = cached): Record<string, string> {
  return {
    '--status-bar-height': `${m.statusBarHeight}px`,
    '--nav-bar-height': `${m.navBarHeight}px`,
    '--nav-content-height': `${m.navContentHeight}px`,
    '--nav-padding-right': `${m.navPaddingRight}px`,
    '--safe-bottom': `${m.safeAreaBottom}px`,
    '--tabbar-height': `${m.tabBarHeight}px`,
    '--page-bottom-tab': `${m.pageBottomWithTab}px`,
    '--page-bottom': `${m.pageBottom}px`,
  }
}
