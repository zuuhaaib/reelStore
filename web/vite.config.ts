import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev: forward /api to the Express server so the session cookie is same-origin.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
