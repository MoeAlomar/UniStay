import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    host: true,
    port: 5173,
    open: false,
    strictPort: true,                           // ✅ helpful on Railway
  },
  preview: {
    host: true,
    port: 5173,
    open: false,
    allowedHosts: [
      'darek-frontend.up.railway.app',
      'darek.up.railway.app',
    ],
  },
})
