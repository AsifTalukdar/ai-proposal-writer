import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import generateHandler from './api/generate.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'vercel-api-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/generate', async (req, res) => {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                if (body) req.body = JSON.parse(body)
              } catch (e) {}

              if (!res.status) {
                res.status = (code) => {
                  res.statusCode = code
                  return res
                }
              }
              if (!res.json) {
                res.json = (data) => {
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                  return res
                }
              }

              try {
                await generateHandler(req, res)
              } catch (err) {
                console.error('API Error:', err)
                if (!res.headersSent) {
                  res.status(500).json({ error: err.message || 'Internal Server Error' })
                }
              }
            })
          })
        }
      }
    ]
  }
})
