import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_PATH || '/',
  server: { 
    allowedHosts: [
      '.preview.with.woa.com',
      '.devnet-preview.with.woa.com',
    ],
    watch: { 
      usePolling: true,
      interval: 100,
    },
  },
})

