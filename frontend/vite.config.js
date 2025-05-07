import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react' // Make sure to include this!

export default defineConfig({
  plugins: [
    react(), // Required for React projects
    tailwindcss()
  ],
  build: {
    outDir: 'build',
    emptyOutDir: true 
  },
  base: '/', // Correct base setting
  server: {
    historyApiFallback: true // For local development
  }
})
