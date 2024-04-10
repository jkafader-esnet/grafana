import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: { proxy: { "/api": { target: "http://localhost:9999", changeOrigin: false, secure: false } } },
  plugins: [react()],
})
