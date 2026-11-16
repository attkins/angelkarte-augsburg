import { onScopeDispose, readonly, ref } from 'vue'

/** Whether the browser thinks it is online. Used to explain that cached data is shown. */
export function useOnline() {
  const online = ref(navigator.onLine)
  const update = () => (online.value = navigator.onLine)
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
  onScopeDispose(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
  return readonly(online)
}
