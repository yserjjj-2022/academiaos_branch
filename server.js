const express = require('express')
const axios = require('axios')

const app = express()
const PORT = 3001
const PROXY_ENDPOINT = process.env.LLM_PROXY_ENDPOINT || 'https://routerai.ru'
const PROXY_KEY = process.env.LLM_PROXY_KEY || ''

// 1. Сначала CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// 2. Потом парсинг тела
app.use(express.json({ limit: '10mb' }))

// 3. Прокси — req.path здесь уже '/chat/completions'
app.use('/api/llm', async (req, res) => {
  const target = `${PROXY_ENDPOINT}/api/v1${req.path}`
  const isStreaming = req.body?.stream === true
  
  console.log('→', target)
  
  try {
    const response = await axios({
      method: req.method,
      url: target,
      data: req.body,
      headers: {
        'Authorization': `Bearer ${PROXY_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: isStreaming ? 'stream' : 'json',
      timeout: 120000,
    })
    
    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      response.data.pipe(res)
    } else {
      res.status(response.status).json(response.data)
    }
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`LLM Proxy running on http://localhost:${PORT}`)
  console.log(`Target: ${PROXY_ENDPOINT}/api/v1`)
})
