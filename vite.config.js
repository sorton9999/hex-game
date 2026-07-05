import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    // If we are developing locally, use root path '/'. 
    // If we are building for GitHub Pages, use the repository subfolder!
    base: command === 'serve' ? '/' : '/hex-game/',
  }
})
