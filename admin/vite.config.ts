import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react(),
    svgr(), // aktifkan plugin SVGR agar bisa import SVG sebagai React component
  ],
  server: {
    port: 5174, // jalankan di port berbeda untuk admin app
  },
})