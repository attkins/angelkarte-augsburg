import { readonly, ref, shallowRef } from 'vue'
import type { LatLng } from '@/utils/distance'

export type LocationStatus = 'idle' | 'locating' | 'found' | 'denied' | 'unavailable'

// Shared state, so the location is only asked for once per visit.
const status = ref<LocationStatus>('idle')
const position = shallowRef<LatLng | null>(null)

/**
 * The visitor's location, asked for on demand only. Nothing is stored or sent anywhere,
 * the browser asks for permission on the first request.
 */
export function useLocation() {
  function request() {
    if (status.value === 'locating' || status.value === 'found') return
    if (!('geolocation' in navigator)) {
      status.value = 'unavailable'
      return
    }
    status.value = 'locating'
    navigator.geolocation.getCurrentPosition(
      (result) => {
        position.value = { lat: result.coords.latitude, lng: result.coords.longitude }
        status.value = 'found'
      },
      (error) => {
        status.value = error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10_000 },
    )
  }

  return { status: readonly(status), position: readonly(position), request }
}

/** Only for tests: forget the shared state. */
export function resetLocationForTests() {
  status.value = 'idle'
  position.value = null
}
