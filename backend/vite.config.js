import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(__dirname, '../frontend/src/component/Frontend')
const backendNodeModules = resolve(__dirname, 'node_modules')

export default defineConfig({
  root: frontendRoot,
  resolve: {
    alias: {
      react: resolve(backendNodeModules, 'react'),
      'react-dom': resolve(backendNodeModules, 'react-dom'),
    },
  },
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../frontend/dist'),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
