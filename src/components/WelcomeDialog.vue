<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { GUEST_ACCESS } from '@/config'
import type { GuestAccess } from '@/types'

const emit = defineEmits<{ close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

/** The colours that matter for a first look, the rarer ones are in the map legend. */
const COLOURS: GuestAccess[] = ['open', 'withMember', 'membersOnly', 'unknown']

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
    class="welcome-dialog"
    aria-labelledby="welcome-dialog-title"
    @cancel.prevent="emit('close')"
    @click="onClick"
  >
    <div class="box">
      <header class="head">
        <div class="logo"><AppIcon name="fish" :size="22" :stroke-width="1.9" /></div>
        <h2 id="welcome-dialog-title" class="serif">Kurz erklärt</h2>
        <button type="button" class="icon-button close" aria-label="Schließen" @click="emit('close')">
          <AppIcon name="close" />
        </button>
      </header>

      <p>
        Die Karte zeigt, an welchen Gewässern rund um Augsburg und in Tirol du mit einer Tageskarte angeln kannst. Wähl
        ein Gewässer aus, dann siehst du Preise, Regeln und wo es die Karte gibt.
      </p>

      <section>
        <h3 class="label">Die Farben</h3>
        <ul class="colours">
          <li v-for="key in COLOURS" :key="key">
            <span
              class="swatch"
              :class="{ 'is-dashed': key === 'unknown' }"
              :style="{ '--swatch': `var(--${GUEST_ACCESS[key].token})` }"
            />
            {{ GUEST_ACCESS[key].label }}
          </li>
        </ul>
      </section>

      <section>
        <h3 class="label">Die Filter</h3>
        <p>
          <strong>Saison offen</strong> zeigt nur Gewässer, an denen Gäste heute angeln dürfen.
          <strong>Karte heute noch</strong> zeigt, wo du heute noch an eine Karte kommst, online oder in einem Laden, der
          noch offen hat. Mit dem Datum planst du einen anderen Tag.
        </p>
      </section>

      <p class="note">
        Alle Angaben ohne Gewähr. Verbindlich ist immer der Erlaubnisschein des Vereins.
      </p>

      <!-- showModal focuses the first focusable element, the main action reads better than the close button. -->
      <button type="button" class="start" autofocus @click="emit('close')">Los geht's</button>
    </div>
  </dialog>
</template>

<style scoped>
.welcome-dialog {
  width: min(440px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  padding: 0;
  border: 0;
  border-radius: 22px;
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}

.welcome-dialog::backdrop {
  background: rgba(15, 24, 22, 0.45);
}

.box {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 20px 22px;
  font-size: 15px;
  line-height: 1.45;
}

.box p {
  margin: 0;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: var(--accent);
  color: var(--on-accent);
}

.head h2 {
  flex: 1;
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

.label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-2);
}

.colours {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.colours li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.swatch {
  flex: 0 0 22px;
  height: 14px;
  border-radius: 4px;
  background: var(--swatch);
}

.swatch.is-dashed {
  background: none;
  border: 1px dashed var(--swatch);
}

.note {
  font-size: 13px;
  color: var(--text-2);
}

.start {
  height: 48px;
  border: 0;
  border-radius: 14px;
  background: var(--accent);
  color: var(--on-accent);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.start:hover {
  filter: brightness(1.08);
}
</style>
