import { createApp } from 'vue'
import '@fontsource-variable/figtree'
import '@fontsource-variable/vollkorn'
import 'leaflet/dist/leaflet.css'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

// Offline use: the service worker only exists in the build (see scripts/lib/service-worker.mjs).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Without it the map still works online, nothing to tell the user.
    })
  })
}
