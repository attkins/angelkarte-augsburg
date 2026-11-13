<script setup lang="ts">
import L from 'leaflet'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

/**
 * Renders its slot inside a Leaflet popup.
 *
 * The slot content stays a normal, reactive Vue subtree. Leaflet only moves the
 * root element into its popup container. Closing the popup in the UI emits `close`,
 * unmounting the component removes the popup without emitting.
 */
const props = defineProps<{
  map: L.Map
  latlng: L.LatLngExpression
  offset?: L.PointTuple
}>()

const emit = defineEmits<{ close: [] }>()

const content = useTemplateRef<HTMLElement>('content')
let popup: L.Popup | null = null
let resizeObserver: ResizeObserver | null = null
let unmounting = false

onMounted(() => {
  popup = L.popup({ maxWidth: 320, autoPanPadding: [20, 20], offset: props.offset ?? [0, 7] })
    .setLatLng(props.latlng)
    .setContent(content.value!)
  popup.on('remove', () => {
    if (!unmounting) emit('close')
  })
  popup.openOn(props.map)

  // Keep the popup layout in sync when the content changes size (new selection, <details> toggled).
  resizeObserver = new ResizeObserver(() => popup?.update())
  resizeObserver.observe(content.value!)
})

watch(
  () => props.latlng,
  (latlng) => popup?.setLatLng(latlng),
)

watch(
  () => props.offset,
  (offset) => {
    if (!popup) return
    popup.options.offset = offset ?? [0, 7]
    popup.update()
  },
)

onBeforeUnmount(() => {
  unmounting = true
  resizeObserver?.disconnect()
  popup?.remove()
})
</script>

<template>
  <!--
    click.stop: Vue patches the DOM between event listeners, so a clicked button may already be
    detached when the event reaches the map container. Leaflet would then treat it as a click on
    the map and clear the selection.
  -->
  <div ref="content" @click.stop><slot /></div>
</template>
