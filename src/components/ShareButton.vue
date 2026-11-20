<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { routeHash } from '@/composables/useHashRoute'
import type { Selection } from '@/types'
import { formatLongDay, parseIsoDay } from '@/utils/time'

const props = defineProps<{
  /** Page to share, becomes the hash of the shared link. */
  route: Selection
  /** Title for the share sheet, e.g. the water name. */
  title: string
  /** Planned day as ISO date, so the link opens with that day. Null or missing for today. */
  day?: string | null
}>()

/** Short feedback below the button, read out by screen readers. */
const status = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

function shareUrl(): string {
  const { origin, pathname, search } = window.location
  return `${origin}${pathname}${search}${routeHash(props.route, props.day)}`
}

function showStatus(text: string) {
  status.value = text
  clearTimeout(timer)
  timer = setTimeout(() => (status.value = null), 2500)
}

async function share() {
  const url = shareUrl()
  if (typeof navigator.share === 'function') {
    try {
      const data: ShareData = { title: `${props.title} · Angelkarte`, url }
      // Messengers show the text next to the link, so friends see which day it is about.
      if (props.day) data.text = `Geplant für ${formatLongDay(parseIsoDay(props.day))}`
      await navigator.share(data)
      return
    } catch (error) {
      // Closing the share sheet is not an error worth telling.
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    showStatus('Link kopiert')
  } catch {
    showStatus('Kopieren nicht möglich')
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span class="share">
    <button type="button" class="icon-button share-button" aria-label="Link teilen" @click="share">
      <AppIcon name="share" :size="18" />
    </button>
    <span class="share-status" role="status">{{ status }}</span>
  </span>
</template>

<style scoped>
.share {
  position: relative;
  flex: 0 0 44px;
  margin-top: -4px;
}

.share-button {
  border: 0;
  background: var(--surface-3);
  color: var(--text-2);
}

.share-button:hover {
  color: var(--text);
}

.share-status {
  position: absolute;
  top: 48px;
  right: 0;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-2);
}

.share-status:empty {
  display: none;
}
</style>
