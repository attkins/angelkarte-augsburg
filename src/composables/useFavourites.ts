import { readonly, shallowRef } from 'vue'

const STORAGE_KEY = 'angelkarte-favourites'

function readStored(): Set<string> {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    // Storage can be blocked, e.g. in private mode, or hold something broken. Then nothing is remembered.
    return new Set()
  }
}

function store(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].sort()))
  } catch {
    // See readStored.
  }
}

// One shared state for the whole app. A new Set on every change, so computed values update.
const favourites = shallowRef<Set<string>>(new Set())
let initialised = false

/**
 * Waters the user marked with a star, kept in local storage on this device only.
 * Ids of waters that no longer exist stay stored and are simply not shown, in case they come back.
 */
export function useFavourites() {
  if (!initialised) {
    initialised = true
    favourites.value = readStored()
    // Another tab of the app changed the favourites.
    window.addEventListener?.('storage', (event) => {
      if (event.key === STORAGE_KEY) favourites.value = readStored()
    })
  }

  function isFavourite(id: string): boolean {
    return favourites.value.has(id)
  }

  function toggle(id: string) {
    const next = new Set(favourites.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    favourites.value = next
    store(next)
  }

  return { favourites: readonly(favourites), isFavourite, toggle }
}

/** Only for tests: forget the shared state. */
export function resetFavouritesForTests() {
  initialised = false
  favourites.value = new Set()
}
