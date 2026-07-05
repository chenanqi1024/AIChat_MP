App({
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync()

    this.globalData.statusBarHeight = systemInfo.statusBarHeight || 0
    this.globalData.windowHeight = systemInfo.windowHeight || 0
  },
  globalData: {
    statusBarHeight: 0,
    windowHeight: 0
  }
})
