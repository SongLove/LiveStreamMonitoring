/** 隐藏原生 tabBar，页面内用 AppTabBar 自定义 UI；切换必须走 switchTab */
export function hideNativeTabBar() {
  try {
    uni.hideTabBar({ animation: false })
  } catch {
    // ignore
  }
}

export function setTabBarSelected(_index: number) {
  hideNativeTabBar()
}
