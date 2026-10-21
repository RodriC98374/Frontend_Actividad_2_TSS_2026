import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    open: false,
    proxy: {
      '/sanctum': {
        target: process.env.BACKEND_PROXY_URL || 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.BACKEND_PROXY_URL || 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})
