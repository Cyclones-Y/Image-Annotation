import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/dev-api': {
        target: 'http://localhost:9099',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev-api/, '')
      },
      '/docker-api': {
        target: 'http://localhost:9099',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docker-api/, '')
      }
    }
  }
})
