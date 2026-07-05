const {
  getRoles,
  getRoleById,
  getHistory,
  sendChat,
  clearHistory,
  FALLBACK_ROLES
} = require('../../services/chat')
const storage = require('../../utils/storage')

const quickTopics = [
  '今天有点累',
  '安慰我一下',
  '陪我聊聊天',
  '听我说说话'
]

const createWelcomeMessage = role => ({
  id: 'welcome',
  sender: 'assistant',
  content: role.welcomeMessage,
  createdAt: new Date().toISOString()
})

Page({
  data: {
    role: FALLBACK_ROLES[0],
    messages: [],
    inputValue: '',
    quickTopics,
    loadingHistory: false,
    sending: false,
    scrollIntoView: ''
  },

  onLoad(options) {
    if (!storage.isLoggedIn()) {
      wx.redirectTo({
        url: '/pages/onboarding/onboarding'
      })
      return
    }

    const roleId = Number(options.roleId || storage.getSelectedRoleId())
    storage.setSelectedRoleId(roleId)
    this.initRole(roleId)
  },

  initRole(roleId) {
    getRoles()
      .then(roles => {
        const role = getRoleById(roles, roleId)
        this.setData({ role })
        this.loadHistory(role.id)
      })
      .catch(() => {
        const role = getRoleById(FALLBACK_ROLES, roleId)
        this.setData({ role })
        this.loadHistory(role.id)
      })
  },

  loadHistory(roleId) {
    this.setData({ loadingHistory: true })

    getHistory(roleId)
      .then(data => {
        const messages = data.messages && data.messages.length
          ? data.messages.map(this.normalizeMessage)
          : [createWelcomeMessage(this.data.role)]

        this.setData({
          messages,
          loadingHistory: false
        })
        this.scrollToBottom()
      })
      .catch(error => {
        this.setData({
          messages: [createWelcomeMessage(this.data.role)],
          loadingHistory: false
        })

        if (error.code === 'AUTH_REQUIRED' || error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED') {
          wx.showToast({
            title: '请重新登录',
            icon: 'none'
          })
          wx.redirectTo({
            url: '/pages/onboarding/onboarding'
          })
        }
      })
  },

  normalizeMessage(message) {
    return {
      id: String(message.id || Date.now()),
      sender: message.sender,
      content: message.content || '',
      createdAt: message.createdAt || new Date().toISOString()
    }
  },

  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  useQuickTopic(e) {
    this.setData({
      inputValue: e.currentTarget.dataset.topic || ''
    })
  },

  sendMessage() {
    const content = this.data.inputValue.trim()

    if (!content || this.data.sending) return

    const tempUserMessage = {
      id: `local-${Date.now()}`,
      sender: 'user',
      content,
      createdAt: new Date().toISOString()
    }

    const messages = this.data.messages.concat(tempUserMessage)

    this.setData({
      inputValue: '',
      sending: true,
      messages
    })
    this.scrollToBottom()

    sendChat(this.data.role.id, content)
      .then(data => {
        const nextMessages = this.data.messages.filter(item => item.id !== tempUserMessage.id)
        const userMessage = this.normalizeMessage(data.userMessage || tempUserMessage)
        const assistantMessage = this.normalizeMessage(data.assistantMessage || {
          sender: 'assistant',
          content: '我听到了，想再和我多说一点吗？'
        })

        this.setData({
          messages: nextMessages.concat(userMessage, assistantMessage),
          sending: false
        })

        storage.upsertRecentChat({
          roleId: this.data.role.id,
          lastMessage: assistantMessage.content || content
        })
        this.scrollToBottom()
      })
      .catch(error => {
        const errorMessage = {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          content: error.message || '消息发送失败，请稍后再试',
          createdAt: new Date().toISOString()
        }

        this.setData({
          messages: this.data.messages.concat(errorMessage),
          sending: false
        })
        this.scrollToBottom()

        if (error.code === 'AUTH_REQUIRED' || error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED') {
          wx.redirectTo({
            url: '/pages/onboarding/onboarding'
          })
        }
      })
  },

  clearCurrentHistory() {
    wx.showModal({
      title: '清空聊天',
      content: `确认清空与${this.data.role.nickname}的聊天记录吗？`,
      confirmText: '清空',
      confirmColor: '#d94b63',
      success: res => {
        if (!res.confirm) return

        clearHistory(this.data.role.id)
          .then(() => {
            storage.removeRecentChat(this.data.role.id)
            this.setData({
              messages: [createWelcomeMessage(this.data.role)]
            })
            wx.showToast({
              title: '已清空',
              icon: 'success'
            })
          })
          .catch(error => {
            wx.showToast({
              title: error.message || '清空失败',
              icon: 'none'
            })
          })
      }
    })
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }

    wx.redirectTo({
      url: '/pages/home/home'
    })
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollIntoView: 'bottom-anchor'
      })
    }, 30)
  }
})
