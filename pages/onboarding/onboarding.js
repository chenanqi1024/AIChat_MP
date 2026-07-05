const { sendCode, login } = require('../../services/auth')
const { getRoles, FALLBACK_ROLES } = require('../../services/chat')
const storage = require('../../utils/storage')

let countdownTimer = null

const isValidPhone = phoneNumber => /^1[3-9]\d{9}$/.test(phoneNumber)

Page({
  data: {
    roles: FALLBACK_ROLES,
    selectedIndex: 0,
    selectedRole: FALLBACK_ROLES[0],
    loadingRoles: false,
    showLogin: false,
    phoneNumber: '',
    verifyCode: '',
    countdown: 0,
    sendingCode: false,
    loginLoading: false,
    errorText: ''
  },

  onLoad() {
    this.loadRoles()
  },

  onUnload() {
    this.clearCountdown()
  },

  loadRoles() {
    this.setData({ loadingRoles: true })

    getRoles()
      .then(roles => {
        const selectedRoleId = storage.getSelectedRoleId()
        const selectedIndex = Math.max(0, roles.findIndex(role => Number(role.id) === selectedRoleId))

        this.setData({
          roles,
          selectedIndex,
          selectedRole: roles[selectedIndex],
          loadingRoles: false
        })
      })
      .catch(() => {
        this.setData({
          roles: FALLBACK_ROLES,
          selectedRole: FALLBACK_ROLES[0],
          selectedIndex: 0,
          loadingRoles: false
        })
      })
  },

  selectRole(e) {
    const selectedIndex = Number(e.currentTarget.dataset.index)
    const selectedRole = this.data.roles[selectedIndex]

    if (!selectedRole) return

    this.setData({
      selectedIndex,
      selectedRole
    })
  },

  startChat() {
    storage.setSelectedRoleId(this.data.selectedRole.id)

    if (storage.isLoggedIn()) {
      wx.redirectTo({
        url: '/pages/home/home'
      })
      return
    }

    this.setData({
      showLogin: true,
      errorText: ''
    })
  },

  closeLogin() {
    this.setData({
      showLogin: false,
      errorText: ''
    })
  },

  onPhoneInput(e) {
    this.setData({
      phoneNumber: String(e.detail.value || '').replace(/\D/g, '').slice(0, 11),
      errorText: ''
    })
  },

  onCodeInput(e) {
    this.setData({
      verifyCode: String(e.detail.value || '').replace(/[^\dA-Za-z]/g, '').slice(0, 8),
      errorText: ''
    })
  },

  handleSendCode() {
    const { phoneNumber, countdown, sendingCode } = this.data

    if (sendingCode || countdown > 0) return

    if (!isValidPhone(phoneNumber)) {
      this.setData({ errorText: '请输入正确的中国大陆手机号' })
      return
    }

    this.setData({
      sendingCode: true,
      errorText: ''
    })

    sendCode(phoneNumber)
      .then(data => {
        const retryAfter = data.retryAfter || 60
        wx.showToast({
          title: '验证码已发送',
          icon: 'success'
        })
        this.startCountdown(retryAfter)
        this.setData({ sendingCode: false })
      })
      .catch(error => {
        this.setData({
          errorText: error.message || '验证码发送失败，请稍后重试',
          sendingCode: false
        })
      })
  },

  startCountdown(seconds) {
    this.clearCountdown()
    this.setData({ countdown: seconds })

    countdownTimer = setInterval(() => {
      const next = this.data.countdown - 1
      if (next <= 0) {
        this.clearCountdown()
        this.setData({ countdown: 0 })
        return
      }
      this.setData({ countdown: next })
    }, 1000)
  },

  clearCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  },

  handleLogin() {
    const { phoneNumber, verifyCode, loginLoading } = this.data

    if (loginLoading) return

    if (!isValidPhone(phoneNumber)) {
      this.setData({ errorText: '请输入正确的中国大陆手机号' })
      return
    }

    if (!verifyCode || verifyCode.length < 4) {
      this.setData({ errorText: '请输入 4 至 8 位验证码' })
      return
    }

    this.setData({
      loginLoading: true,
      errorText: ''
    })

    login(phoneNumber, verifyCode)
      .then(() => {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        wx.redirectTo({
          url: '/pages/home/home'
        })
        this.setData({ loginLoading: false })
      })
      .catch(error => {
        this.setData({
          errorText: error.message || '登录失败，请检查验证码',
          loginLoading: false
        })
      })
  }
})
