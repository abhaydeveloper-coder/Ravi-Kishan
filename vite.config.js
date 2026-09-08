import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: false,
    allowedHosts: ['alkaline-delirium-spongy.ngrok-free.dev'],
  },
  publicDir: 'public',
})
