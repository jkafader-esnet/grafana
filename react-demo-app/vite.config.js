import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/public": {
        target: "http://grafana.local.es.net:3000",
        changeOrigin: false,
      },
      "/login": {
        target: "http://grafana.local.es.net:3000",
        changeOrigin: false,
      },
      "/logout": {
        target: "http://grafana.local.es.net:3000",
        changeOrigin: false,
      },
      "/api": {
          target: "http://grafana.local.es.net:3000",
        changeOrigin: false,
      }
    }
  },
  plugins: [react()],
})
