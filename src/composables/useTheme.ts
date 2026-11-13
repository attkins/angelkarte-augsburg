import { readonly, ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'angelkarte-theme'

function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    // Storage can be blocked, e.g. in private mode. The theme then just is not remembered.
    return null
  }
}

function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // See readStoredTheme.
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// One shared state for the whole app.
const theme = ref<Theme>('light')
let initialised = false

function apply(value: Theme) {
  document.documentElement.dataset.theme = value
}

/**
 * Light or dark theme.
 *
 * Starts with the theme the user picked last time, otherwise the system setting.
 * As long as the user has not picked one, it follows changes of the system setting.
 */
export function useTheme() {
  if (!initialised) {
    initialised = true
    const stored = readStoredTheme()
    theme.value = stored ?? systemTheme()
    apply(theme.value)
    watch(theme, apply)

    if (!stored) {
      window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', (event) => {
        if (!readStoredTheme()) theme.value = event.matches ? 'dark' : 'light'
      })
    }
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    storeTheme(theme.value)
  }

  return { theme: readonly(theme), toggle }
}

/** Only for tests: forget the shared state. */
export function resetThemeForTests() {
  initialised = false
  theme.value = 'light'
}
