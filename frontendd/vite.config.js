import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://social-media-7b30.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://social-media-7b30.onrender.com',
        changeOrigin: true,
      }
    }
  }
})
