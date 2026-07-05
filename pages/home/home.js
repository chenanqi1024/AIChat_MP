const { getRoles, getRoleById, FALLBACK_ROLES } = require('../../services/chat')
const storage = require('../../utils/storage')

const formatRecentTime = timestamp => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    const hour = date.getHours() < 10 ? `0${date.getHours()}` : `${date.getHours()}`
    const minute = date.getMinutes() < 10 ? `0${date.getMinutes()}` : `${date.getMinutes()}`
    return `${hour}:${minute}`
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

Page({
  data: {
    roles: FALLBACK_ROLES,
    currentRole: FALLBACK_ROLES[0],
    recentChats: [],
    greetingText: '你好',
    loading: false
  },

  onShow() {
    if (!storage.isLoggedIn()) {
      wx.redirectTo({
        url: '/pages/onboarding/onboarding'
      })
      return
    }

    this.setGreeting()
    this.loadRoles()
  },

  setGreeting() {
    const hour = new Date().getHours()
    let greetingText = '晚上好'

    if (hour < 12) {
      greetingText = '早上好'
    } else if (hour < 18) {
      greetingText = '下午好'
    }

    this.setData({ greetingText })
  },

  loadRoles() {
    this.setData({ loading: true })

    getRoles()
      .then(roles => {
        const currentRole = getRoleById(roles, storage.getSelectedRoleId())
        this.setData({
          roles,
          currentRole,
          loading: false
        })
        this.loadRecentChats()
      })
      .catch(() => {
        const currentRole = getRoleById(FALLBACK_ROLES, storage.getSelectedRoleId())
        this.setData({
          roles: FALLBACK_ROLES,
          currentRole,
          loading: false
        })
        this.loadRecentChats()
      })
  },

  loadRecentChats() {
    const roles = this.data.roles
    const recentChats = storage.getRecentChats().map(chat => {
      const role = getRoleById(roles, chat.roleId)
      return {
        ...chat,
        role,
        timeText: formatRecentTime(chat.updatedAt)
      }
    })

    this.setData({ recentChats })
  },

  selectRole(e) {
    const roleId = Number(e.currentTarget.dataset.roleid)
    const currentRole = getRoleById(this.data.roles, roleId)

    storage.setSelectedRoleId(roleId)
    this.setData({ currentRole })
  },

  startCurrentChat() {
    this.openChat(this.data.currentRole.id)
  },

  openChatByRole(e) {
    this.openChat(e.currentTarget.dataset.roleid)
  },

  continueChat() {
    const recent = this.data.recentChats[0]
    this.openChat(recent ? recent.roleId : this.data.currentRole.id)
  },

  reselectRole() {
    wx.redirectTo({
      url: '/pages/onboarding/onboarding'
    })
  },

  openHistory() {
    this.openChat(this.data.currentRole.id)
  },

  openChat(roleId) {
    storage.setSelectedRoleId(roleId)
    wx.navigateTo({
      url: `/pages/chat/chat?roleId=${roleId}`
    })
  }
})
