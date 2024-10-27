import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from "node:path";
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({}), react(), basicSsl()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:8082',
        changeOrigin: true,
        secure: false, // Disable SSL verification for self-signed certificates
      },
      '/auth': {
        target: 'https://localhost:8082',
        changeOrigin: true,
        secure: false, // Disable SSL verification for self-signed certificates
      },
    }
  }
})
