const { LOGIN_API_BASE } = require('./config')
const { request } = require('./request')
const { setSession } = require('../utils/storage')

const sendCode = phoneNumber => request({
  baseUrl: LOGIN_API_BASE,
  url: '/send-code',
  method: 'POST',
  data: {
    countryCode: '86',
    phoneNumber
  }
})

const login = (phoneNumber, verifyCode) => request({
  baseUrl: LOGIN_API_BASE,
  url: '/login',
  method: 'POST',
  data: {
    countryCode: '86',
    phoneNumber,
    verifyCode
  }
}).then(data => {
  setSession(data)
  return data
})

module.exports = {
  sendCode,
  login
}
