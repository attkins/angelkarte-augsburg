import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { serviceWorker } from './scripts/lib/service-worker.mjs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  // Relative base so the build works on GitHub Pages under /<repo>/ as well as on any other path.
  base: './',
  // The service worker keeps the app, the data and recently viewed tiles for offline use.
  plugins: [vue(), serviceWorker()],
  define: {
    // Shown in the panel footer and the imprint. Bump it with `npm version`, see README.
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
