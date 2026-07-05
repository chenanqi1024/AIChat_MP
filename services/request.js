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

const normalizeRequestFail = err => {
  const errMsg = err && err.errMsg ? err.errMsg : ''

  if (errMsg.indexOf('url not in domain list') >= 0 || errMsg.indexOf('not in domain list') >= 0) {
    return {
      success: false,
      code: 'DOMAIN_NOT_CONFIGURED',
      message: '请求域名未配置，请在微信开发者工具开启“不校验合法域名”，或在小程序后台配置 request 合法域名',
      details: errMsg
    }
  }

  if (errMsg.indexOf('timeout') >= 0) {
    return {
      success: false,
      code: 'REQUEST_TIMEOUT',
      message: '请求超时，请稍后重试',
      details: errMsg
    }
  }

  return {
    success: false,
    code: 'NETWORK_ERROR',
    message: '请求失败，请检查网络、域名白名单或开发者工具网络设置',
    details: errMsg
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
      fail(err) {
        reject(normalizeRequestFail(err))
      }
    })
  })
}

module.exports = {
  request,
  AUTH_ERROR_CODES
}
