const { getToken, clearSession } = require('../utils/storage')

const AUTH_ERROR_CODES = ['AUTH_REQUIRED', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'USER_DISABLED']

const buildQuery = query => {
  if (!query) return ''

  const pairs = Object.keys(query)
    .filter(key => query[key] !== undefined && query[key] !== null && query[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)

  return pairs.length ? `?${pairs.join('&')}` : ''
}

const normalizeError = (statusCode, body) => {
  const code = body && body.code ? body.code : `HTTP_${statusCode || 'ERROR'}`
  const message = body && body.message ? body.message : '请求失败，请稍后再试'

  return {
    success: false,
    statusCode,
    code,
    message,
    details: body && body.details
  }
}

const request = options => {
  const token = getToken()
  const header = {
    'Content-Type': 'application/json',
    ...(options.header || {})
  }

  if (options.auth && token) {
    header.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${options.baseUrl}${options.url}${buildQuery(options.query)}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      success(res) {
        const body = res.data || {}
        const statusOk = res.statusCode >= 200 && res.statusCode < 300
        const businessOk = body.success !== false

        if (statusOk && businessOk) {
          resolve(body.data !== undefined ? body.data : body)
          return
        }

        const error = normalizeError(res.statusCode, body)
        if (AUTH_ERROR_CODES.indexOf(error.code) >= 0 || res.statusCode === 401) {
          clearSession()
        }
        reject(error)
      },
      fail() {
        reject({
          success: false,
          code: 'NETWORK_ERROR',
          message: '网络连接失败，请检查网络后重试'
        })
      }
    })
  })
}

module.exports = {
  request,
  AUTH_ERROR_CODES
}
