import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'build',
    emptyOutDir: true 
  },
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] },
  base: '/'
})
