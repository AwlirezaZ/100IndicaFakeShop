import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds everything into ONE html file so it can be opened by double-click (no server needed).
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: './',
})
