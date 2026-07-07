const express = require('express')
const axios = require('axios')
const app = express()
const PORT = 3001

app.use(express.json())

// Разрешаем CORS для фронтенда
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', 'POST,GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Проксируем все запросы к LLM
app.use('/api/llm', (req, res, next) => {
  const proxyEndpoint = process.env.LLM_PROXY_ENDPOINT || 'https://routerai.ru/v1'
  const proxyKey = process.env.LLM_PROXY_KEY || ''
  
  console.log('Proxying:', proxyEndpoint + req.path)
  console.log('Body:', JSON.stringify(req.body).substring(0, 200))
  
  axios.post(
    `${proxyEndpoint}${req.path}`,
    req.body,
    {
      headers: {
        'Authorization': `Bearer ${proxyKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  ).then(response => {
    res.json(response.data)
  }).catch(error => {
    console.error('Proxy error:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    })
  })
})

app.listen(PORT, () => {
  console.log(`LLM Proxy server running on http://localhost:${PORT}`)
})
