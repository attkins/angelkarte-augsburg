import { ref, shallowRef } from 'vue'
import { DATA_FILES } from '@/config'
import type { Club, MapData } from '@/types'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`)
  }
  return (await response.json()) as T
}

/**
 * Builds lookup tables for the raw data files.
 *
 * Sales points are the single source of truth for the water <-> sales point
 * relation (property `waterIds`). The reverse direction is derived here so
 * the data files never have to be kept in sync by hand.
 */
export function buildMapData(
  clubs: Club[],
  waters: MapData['waters'],
  salesPoints: MapData['salesPoints'],
): MapData {
  const salesPointIdsByWater = new Map<string, string[]>()
  for (const feature of salesPoints.features) {
    for (const waterId of feature.properties.waterIds ?? []) {
      const ids = salesPointIdsByWater.get(waterId) ?? []
      ids.push(feature.properties.id)
      salesPointIdsByWater.set(waterId, ids)
    }
  }

  return {
    clubs,
    waters,
    salesPoints,
    clubsById: new Map(clubs.map((club) => [club.id, club])),
    watersById: new Map(waters.features.map((f) => [f.properties.id, f])),
    salesPointsById: new Map(salesPoints.features.map((f) => [f.properties.id, f])),
    salesPointIdsByWater,
  }
}

export function useMapData() {
  // shallowRef: the data is read-only and large, deep reactivity would only cost performance.
  const data = shallowRef<MapData | null>(null)
  const error = shallowRef<Error | null>(null)
  const loading = ref(true)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const [clubs, waters, salesPoints] = await Promise.all([
        fetchJson<Club[]>(DATA_FILES.clubs),
        fetchJson<MapData['waters']>(DATA_FILES.waters),
        fetchJson<MapData['salesPoints']>(DATA_FILES.salesPoints),
      ])
      data.value = buildMapData(clubs, waters, salesPoints)
    } catch (e) {
      console.error(e)
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false
    }
  }

  void load()

  return { data, error, loading, reload: load }
}
