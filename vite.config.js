import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change 'lifeos' to whatever you name your GitHub repo
  base: '/lifeos/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
