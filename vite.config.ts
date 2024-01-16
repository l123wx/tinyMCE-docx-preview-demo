import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/tinyMCE-docx-preview-demo/',
  plugins: [vue()],
})
