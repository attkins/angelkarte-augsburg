import { onScopeDispose, readonly, ref } from 'vue'

/**
 * A page that is open while the URL hash matches, e.g. `#/impressum`.
 *
 * The hash makes the page linkable and lets the back button close it on phones.
 * When the page was opened inside the app, closing it goes back in the history,
 * so no extra entry is left behind. When it was opened from a link, the hash is
 * just removed.
 */
export function useHashPage(hash: string) {
  const active = ref(window.location.hash === hash)
  let openedInApp = false

  function sync() {
    active.value = window.location.hash === hash
    if (!active.value) openedInApp = false
  }

  window.addEventListener('hashchange', sync)
  onScopeDispose(() => window.removeEventListener('hashchange', sync))

  function open() {
    if (active.value) return
    openedInApp = true
    window.location.hash = hash
    // hashchange fires asynchronously, show the page right away.
    active.value = true
  }

  function close() {
    if (!active.value) return
    if (openedInApp) {
      window.history.back()
    } else {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    }
    openedInApp = false
    active.value = false
  }

  return { active: readonly(active), open, close }
}
