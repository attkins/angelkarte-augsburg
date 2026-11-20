import { readonly, ref } from 'vue'

const STORAGE_KEY = 'angelkarte-welcome-seen'

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    // Storage can be blocked, e.g. in private mode. Then the explanation shows on every visit.
    return false
  }
}

function storeSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10))
  } catch {
    // See readSeen.
  }
}

// One shared state for the whole app.
const open = ref(false)
let initialised = false

/**
 * The short explanation shown on the first visit.
 *
 * Opens by itself until it was closed once, then only through `show()` (the help link).
 * Closing stores the day in local storage on this device.
 */
export function useWelcome() {
  if (!initialised) {
    initialised = true
    open.value = !readSeen()
  }

  function show() {
    open.value = true
  }

  function close() {
    open.value = false
    storeSeen()
  }

  return { open: readonly(open), show, close }
}

/** Only for tests: forget the shared state. */
export function resetWelcomeForTests() {
  initialised = false
  open.value = false
}
