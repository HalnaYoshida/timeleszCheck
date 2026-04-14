import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api/person/2000088701 → https://thetv.jp/person/2000088701/tv/
      '/api/person': {
        target: 'https://thetv.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/person', '/person') + '/tv/',
      },
    },
  },
})
