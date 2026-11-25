import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: { exclude: ['maplibre-gl'] },
  server: { port: 5180, strictPort: true, host: '127.0.0.1' },
  preview: { port: 5181, strictPort: true, host: '127.0.0.1' },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) return 'maplibre'
        },
      },
    },
  },
})
