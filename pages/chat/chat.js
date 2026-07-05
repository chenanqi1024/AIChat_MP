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

const MAX_IMAGE_SIZE = 6 * 1024 * 1024

const getImageMimeType = filePath => {
  const path = String(filePath || '').toLowerCase()

  if (path.indexOf('.png') >= 0) return 'image/png'
  if (path.indexOf('.webp') >= 0) return 'image/webp'
  if (path.indexOf('.jpg') >= 0 || path.indexOf('.jpeg') >= 0) return 'image/jpeg'
  if (path.indexOf('.gif') >= 0 || path.indexOf('.heic') >= 0 || path.indexOf('.heif') >= 0 || path.indexOf('.bmp') >= 0) return ''

  return 'image/jpeg'
}

const readImageAsDataUrl = filePath => new Promise((resolve, reject) => {
  const fs = wx.getFileSystemManager()
  const mimeType = getImageMimeType(filePath)

  if (!mimeType) {
    reject(new Error('仅支持 JPEG、PNG、WebP 图片'))
    return
  }

  fs.readFile({
    filePath,
    encoding: 'base64',
    success(res) {
      if (res.data && res.data.length > MAX_IMAGE_SIZE * 1.4) {
        reject(new Error('图片不能超过 6MB'))
        return
      }
      resolve(`data:${mimeType};base64,${res.data}`)
    },
    fail() {
      reject(new Error('图片读取失败，请重新选择'))
    }
  })
})

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
    selectedImage: null,
    quickTopics,
    loadingHistory: false,
    sending: false,
    convertingImage: false,
    canSend: false,
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
      imagePath: message.imagePath || '',
      createdAt: message.createdAt || new Date().toISOString()
    }
  },

  onInput(e) {
    const inputValue = e.detail.value

    this.setData({
      inputValue,
      canSend: Boolean(inputValue.trim() || this.data.selectedImage)
    })
  },

  useQuickTopic(e) {
    const inputValue = e.currentTarget.dataset.topic || ''

    this.setData({
      inputValue,
      canSend: Boolean(inputValue || this.data.selectedImage)
    })
  },

  chooseImage() {
    if (this.data.sending || this.data.convertingImage) return

    const handleSuccess = res => {
      const tempFile = res.tempFiles && res.tempFiles[0]
      const tempFilePath = tempFile && (tempFile.tempFilePath || tempFile.path)
      const size = tempFile && tempFile.size

      if (!tempFilePath) {
        wx.showToast({
          title: '图片选择失败',
          icon: 'none'
        })
        return
      }

      if (size && size > MAX_IMAGE_SIZE) {
        wx.showToast({
          title: '图片不能超过 6MB',
          icon: 'none'
        })
        return
      }

      this.setData({ convertingImage: true })

      readImageAsDataUrl(tempFilePath)
        .then(dataUrl => {
          this.setData({
            selectedImage: {
              tempFilePath,
              dataUrl,
              size: size || 0
            },
            convertingImage: false,
            canSend: true
          })
        })
        .catch(error => {
          this.setData({ convertingImage: false })
          wx.showToast({
            title: error.message,
            icon: 'none'
          })
        })
    }

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: handleSuccess
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: handleSuccess
    })
  },

  removeSelectedImage() {
    this.setData({
      selectedImage: null,
      canSend: Boolean(this.data.inputValue.trim())
    })
  },

  previewSelectedImage() {
    if (!this.data.selectedImage) return

    wx.previewImage({
      urls: [this.data.selectedImage.tempFilePath],
      current: this.data.selectedImage.tempFilePath
    })
  },

  previewMessageImage(e) {
    const src = e.currentTarget.dataset.src

    if (!src) return

    wx.previewImage({
      urls: [src],
      current: src
    })
  },

  updateCanSend() {
    this.setData({
      canSend: Boolean(this.data.inputValue.trim() || this.data.selectedImage)
    })
  },

  sendMessage() {
    const content = this.data.inputValue.trim()
    const selectedImage = this.data.selectedImage

    if ((!content && !selectedImage) || this.data.sending || this.data.convertingImage) return

    const tempUserMessage = {
      id: `local-${Date.now()}`,
      sender: 'user',
      content,
      imagePath: selectedImage ? selectedImage.tempFilePath : '',
      createdAt: new Date().toISOString()
    }

    const messages = this.data.messages.concat(tempUserMessage)

    this.setData({
      inputValue: '',
      selectedImage: null,
      canSend: false,
      sending: true,
      messages
    })
    this.scrollToBottom()

    sendChat(this.data.role.id, content, selectedImage ? selectedImage.dataUrl : '')
      .then(data => {
        const nextMessages = this.data.messages.filter(item => item.id !== tempUserMessage.id)
        const userMessage = this.normalizeMessage(data.userMessage || tempUserMessage)
        if (selectedImage) {
          userMessage.imagePath = selectedImage.tempFilePath
          if (userMessage.content === '[图片]') userMessage.content = ''
        }
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
          lastMessage: assistantMessage.content || content || '[图片]'
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
