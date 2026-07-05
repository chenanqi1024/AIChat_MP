const TOKEN_KEY = 'ai_chat_access_token'
const USER_KEY = 'ai_chat_user'
const TOKEN_EXPIRE_KEY = 'ai_chat_token_expires_at'
const SELECTED_ROLE_KEY = 'ai_chat_selected_role_id'
const RECENT_CHATS_KEY = 'ai_chat_recent_chats'

const getToken = () => wx.getStorageSync(TOKEN_KEY) || ''

const getUser = () => wx.getStorageSync(USER_KEY) || null

const setSession = loginData => {
  const expiresIn = loginData.expiresIn || 0
  const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : 0

  wx.setStorageSync(TOKEN_KEY, loginData.accessToken)
  wx.setStorageSync(USER_KEY, loginData.user)
  wx.setStorageSync(TOKEN_EXPIRE_KEY, expiresAt)
}

const clearSession = () => {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
  wx.removeStorageSync(TOKEN_EXPIRE_KEY)
}

const isLoggedIn = () => {
  const token = getToken()
  const expiresAt = wx.getStorageSync(TOKEN_EXPIRE_KEY)

  if (!token) return false
  if (expiresAt && Date.now() > expiresAt) {
    clearSession()
    return false
  }

  return true
}

const setSelectedRoleId = roleId => {
  wx.setStorageSync(SELECTED_ROLE_KEY, Number(roleId))
}

const getSelectedRoleId = () => Number(wx.getStorageSync(SELECTED_ROLE_KEY) || 1)

const getRecentChats = () => wx.getStorageSync(RECENT_CHATS_KEY) || []

const upsertRecentChat = chat => {
  const recentChats = getRecentChats().filter(item => Number(item.roleId) !== Number(chat.roleId))
  const nextChats = [{
    ...chat,
    updatedAt: Date.now()
  }].concat(recentChats).slice(0, 6)

  wx.setStorageSync(RECENT_CHATS_KEY, nextChats)
}

const removeRecentChat = roleId => {
  const nextChats = getRecentChats().filter(item => Number(item.roleId) !== Number(roleId))
  wx.setStorageSync(RECENT_CHATS_KEY, nextChats)
}

module.exports = {
  getToken,
  getUser,
  setSession,
  clearSession,
  isLoggedIn,
  setSelectedRoleId,
  getSelectedRoleId,
  getRecentChats,
  upsertRecentChat,
  removeRecentChat
}
