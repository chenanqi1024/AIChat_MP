# 本次改动日志

## 新增文件
- `services/config.js`：配置 LoginService 与 ChatService 的 Base URL。
- `services/request.js`：封装微信小程序 `wx.request`，统一处理 JSON、JWT、认证失效和错误响应。
- `services/auth.js`：封装发送验证码与手机号验证码登录。
- `services/chat.js`：封装角色、聊天、历史和清空聊天接口，并提供 Figma 设计中的默认角色兜底数据。
- `utils/storage.js`：封装 Token、用户、当前角色和最近聊天的本地存储。
- `pages/onboarding/`：实现角色选择页和手机号验证码登录弹层。
- `pages/home/`：实现首页、推荐角色、全部角色、快捷入口和最近聊天。
- `pages/chat/`：实现聊天页、历史加载、非流式发送消息和清空当前角色聊天。
- `logs/2026-07-05-execute-agents.md`：记录本次执行 `AGENTS.md` 的实现内容。

## 修改文件
- `app.json`：将入口切换为 `pages/onboarding/onboarding`，注册 `home` 和 `chat` 页面，移除旧模板页面注册，并启用自定义导航样式。
- `app.js`：保留全局设备信息，移除模板项目的本地日志和示例登录逻辑。
- `app.wxss`：新增全局页面、按钮、图片、安全区和文本工具样式。

## 完成功能
- 已通过 Figma MCP 读取 `figma.com/make` 设计内容，并将 React/Tailwind 结构翻译为微信小程序 WXML/WXSS/JS。
- 已接入后端 API 文档中的 `/send-code`、`/login`、`/roles`、`/chat`、`/history` 和 `DELETE /history`。
- 已实现手机号验证码登录，登录成功后保存 JWT，用于聊天、历史和清空聊天请求。
- 已实现角色选择、首页角色浏览、最近聊天记录、聊天历史加载、发送消息和清空聊天。
- 聊天接口使用 `stream: false`，优先保证微信小程序环境中的可运行闭环。

## 当前仍未完成的内容
- 未实现图片消息上传。
- 未实现 POST SSE 流式聊天展示。
- 未做真机验证。
- 远程图片和 API 需要微信小程序后台配置合法域名后才能在正式环境稳定访问。

## 运行说明或注意事项
- 使用微信开发者工具打开本项目即可预览。
- 登录前需要先选择角色并点击“开始聊天”。
- 如微信开发者工具未配置合法域名校验豁免，需在小程序后台加入 API 与图片域名。
