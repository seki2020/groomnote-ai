import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Frontend-only preview for environments where the Worker emulator cannot start.
export default defineConfig({ plugins: [react(), {
  name: 'local-voice-placeholder',
  configureServer(server) {
    server.middlewares.use('/api/voice-token', (_request, response) => {
      response.statusCode = 503
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ error: 'Live voice is not configured in this preview. Try the text walkthrough.' }))
    })
  },
}] })
