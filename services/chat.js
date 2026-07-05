const { CHAT_API_BASE } = require('./config')
const { request } = require('./request')

const ROLE_META = {
  1: {
    key: 'naitang',
    tag: '猫咪系',
    greeting: '今天也要开心喵~',
    welcomeMessage: '喵呜，我是奶糖，今天也想黏在你身边陪你聊天呀。你想先跟我说说现在的心情，还是让我蹭蹭你再开始？'
  },
  2: {
    key: 'wanqing',
    tag: '温柔姐姐',
    greeting: '有什么想聊的吗？',
    welcomeMessage: '你好呀，我是晚晴。看起来你今天也经历了很多事情呢，想和我聊聊吗？我会一直陪着你的。'
  },
  3: {
    key: 'yaochuan',
    tag: '阳光少年',
    greeting: '嘿！今天过得怎么样？',
    welcomeMessage: '嘿！我是曜川，很高兴能陪你聊天。不管遇到什么事，我都会在你身边的！今天过得怎么样？'
  },
  4: {
    key: 'xiaofu',
    tag: '梦境精灵',
    greeting: '要一起做个美梦吗？',
    welcomeMessage: '嗨~ 我是小芙，来自梦境的精灵。在这里，你可以和我分享任何想说的话，就像在温柔的梦里一样安心。'
  }
}

const FALLBACK_ROLES = [
  {
    id: 1,
    key: 'naitang',
    nickname: '奶糖',
    description: '一只会撒娇、会贴贴、会蹭蹭人的猫咪系陪伴角色。',
    avatarUrl: 'https://zzz-pet.oss-cn-hangzhou.aliyuncs.com/image/chat_avatar_cat.jpg',
    backgroundUrl: 'https://zzz-pet.oss-cn-hangzhou.aliyuncs.com/image/chat_bg_cat.jpg'
  },
  {
    id: 2,
    key: 'wanqing',
    nickname: '晚晴',
    description: '温柔成熟的姐姐型陪伴角色，愿意倾听你所有的心事。',
    avatarUrl: 'https://zzz-pet.oss-cn-hangzhou.aliyuncs.com/image/chat_avatar_girl.jpg',
    backgroundUrl: 'https://zzz-pet.oss-cn-hangzhou.aliyuncs.com/image/chat_bg_girl.jpg'
  },
  {
    id: 3,
    key: 'yaochuan',
    nickname: '曜川',
    description: '阳光帅气的少年型陪伴角色，用笑容驱散你的阴霾。',
    avatarUrl: 'https://zzz-pet.oss-cn-hangzhou.aliyuncs.com/image/chat_avatar_boy.jpg',
    backgroundUrl: 'https://zzz-pet.oss-cn-hangzhou.aliyuncs.com/image/chat_bg_boy.jpg'
  },
  {
    id: 4,
    key: 'xiaofu',
    nickname: '小芙',
    description: '梦境系精灵陪伴角色，在梦境中寻找温暖的陪伴。',
    avatarUrl: 'https://zzz-pet.oss-cn-hangzhou.aliyuncs.com/image/chat_avatar_elf.jpg',
    backgroundUrl: 'https://zzz-pet.oss-cn-hangzhou.aliyuncs.com/image/chat_bg_elf.jpg'
  }
]

const normalizeRole = role => {
  const fallback = FALLBACK_ROLES.find(item => Number(item.id) === Number(role.id)) || {}
  const meta = ROLE_META[Number(role.id)] || {}

  return {
    id: Number(role.id || fallback.id),
    key: role.key || fallback.key || meta.key,
    nickname: role.nickname || role.name || fallback.nickname,
    description: role.description || fallback.description,
    avatarUrl: role.avatarUrl || role.avatar || fallback.avatarUrl,
    backgroundUrl: role.backgroundUrl || role.background || fallback.backgroundUrl,
    tag: role.tag || meta.tag || '陪伴角色',
    greeting: role.greeting || meta.greeting || '我会一直陪着你',
    welcomeMessage: role.welcomeMessage || meta.welcomeMessage || '你好呀，我在这里陪你。'
  }
}

const normalizeRoles = roles => {
  if (!Array.isArray(roles) || !roles.length) {
    return FALLBACK_ROLES.map(normalizeRole)
  }

  return roles.map(normalizeRole)
}

const getRoleById = (roles, roleId) => {
  const normalizedRoles = normalizeRoles(roles)
  return normalizedRoles.find(role => Number(role.id) === Number(roleId)) || normalizedRoles[0]
}

const getRoles = () => request({
  baseUrl: CHAT_API_BASE,
  url: '/roles'
}).then(data => normalizeRoles(data.roles))

const getHistory = (roleId, beforeId) => request({
  baseUrl: CHAT_API_BASE,
  url: '/history',
  auth: true,
  query: {
    roleId,
    beforeId,
    limit: 50
  }
})

const sendChat = (roleId, message, image) => request({
  baseUrl: CHAT_API_BASE,
  url: '/chat',
  method: 'POST',
  auth: true,
  data: {
    roleId,
    message,
    image,
    stream: false
  }
})

const clearHistory = roleId => request({
  baseUrl: CHAT_API_BASE,
  url: '/history',
  method: 'DELETE',
  auth: true,
  query: {
    roleId
  }
})

module.exports = {
  FALLBACK_ROLES: FALLBACK_ROLES.map(normalizeRole),
  normalizeRoles,
  getRoleById,
  getRoles,
  getHistory,
  sendChat,
  clearHistory
}
