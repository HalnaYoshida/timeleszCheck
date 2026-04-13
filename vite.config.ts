import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/schedule': {
        target: 'https://thetv.jp',
        changeOrigin: true,
        rewrite: () => '/person/2000088701/tv/',
      },
    },
  },
})
