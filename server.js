const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
const PORT = 3001

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Проксируем все запросы к LLM
app.use('/api/llm', createProxyMiddleware({
  target: process.env.LLM_PROXY_ENDPOINT || 'https://routerai.ru',
  changeOrigin: true,
  pathRewrite: {
    '^/api/llm': '/v1',  // /api/llm/chat/completions → /v1/chat/completions
  },
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.LLM_PROXY_KEY || ''}`)
    }
  }
}))

app.listen(PORT, () => {
  console.log(`LLM Proxy running on http://localhost:${PORT}`)
})
