<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import RegionSilhouette from '@/components/RegionSilhouette.vue'
import type { Region, RegionId } from '@/config'

defineProps<{ regions: readonly Region[]; current: RegionId | null }>()
const emit = defineEmits<{ select: [region: Region]; close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

// The parent mounts the dialog only while it is open. showModal traps the focus and draws the backdrop.
onMounted(() => {
  const element = dialog.value
  if (!element) return
  if (typeof element.showModal === 'function') element.showModal()
  else element.setAttribute('open', '')
})

/** The content sits in an inner box, so a click on the dialog element itself hit the backdrop. */
function onClick(event: MouseEvent) {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="region-dialog"
    aria-labelledby="region-dialog-title"
    @cancel.prevent="emit('close')"
    @click="onClick"
  >
    <div class="box">
      <header class="head">
        <h2 id="region-dialog-title" class="serif">Region wählen</h2>
        <button type="button" class="icon-button close" aria-label="Schließen" @click="emit('close')">
          <AppIcon name="close" />
        </button>
      </header>
      <ul class="regions">
        <li v-for="region in regions" :key="region.id">
          <button
            type="button"
            class="region"
            :class="{ 'is-current': region.id === current }"
            :aria-current="region.id === current ? 'true' : undefined"
            @click="emit('select', region)"
          >
            <RegionSilhouette :region="region.id" class="scenery" />
            <span class="text">
              <span class="name">{{ region.label }}</span>
              <span class="description">{{ region.description }}</span>
            </span>
            <AppIcon v-if="region.id === current" name="check" class="check" />
          </button>
        </li>
      </ul>
    </div>
  </dialog>
</template>

<style scoped>
.region-dialog {
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  padding: 0;
  border: 0;
  border-radius: 22px;
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}

.region-dialog::backdrop {
  background: rgba(15, 24, 22, 0.45);
}

.box {
  padding: 20px 20px 22px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.head h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.close {
  border: 0;
  background: transparent;
  color: var(--text);
}

.close:hover {
  background: var(--surface-3);
}

.regions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.region {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-2);
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.region:hover {
  border-color: var(--accent);
}

/* The silhouette sits behind the text on the right and fades out towards the label. */
.scenery {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: -1;
  width: 70%;
  height: 100%;
  color: var(--accent);
  opacity: 0.2;
  pointer-events: none;
  mask-image: linear-gradient(to right, transparent, #000 45%);
  transition: opacity 160ms ease;
}

.region:hover .scenery,
.region.is-current .scenery {
  opacity: 0.32;
}

@media (prefers-reduced-motion: reduce) {
  .scenery {
    transition: none;
  }
}

.region.is-current {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-size: 16px;
  font-weight: 600;
}

.description {
  font-size: 13px;
  color: var(--text-2);
}

.check {
  flex: none;
  color: var(--accent-text);
}
</style>
