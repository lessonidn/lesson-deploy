import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          katex: ['katex'],
        },
      },
    },
    // opsional: naikkan limit warning biar log lebih bersih
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    // ✅ fallback supaya route React tidak 404 saat preview
    fs: {
      strict: true,
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})