/** Snap states of the bottom sheet on small screens, from lowest to highest. */
export const SHEET_STATES = ['peek', 'half', 'full'] as const
export type SheetState = (typeof SHEET_STATES)[number]

/** Below this distance in px a gesture on the handle counts as a tap. */
export const TAP_DISTANCE = 8
/** A drag of at least this distance in px moves the sheet one state further. */
export const STEP_DISTANCE = 40
/** A drag over this share of the viewport height moves the sheet two states. */
const LONG_DRAG_SHARE = 0.4

/** Tapping the handle toggles between peek and half, from full it goes back to half. */
export function sheetStateAfterTap(current: SheetState): SheetState {
  return current === 'half' ? 'peek' : 'half'
}

/**
 * The state the sheet snaps to after the handle was dragged by `dy` px
 * (negative is upwards, which opens the sheet further).
 */
export function sheetStateAfterDrag(current: SheetState, dy: number, viewportHeight: number): SheetState {
  const distance = Math.abs(dy)
  if (distance < TAP_DISTANCE) return sheetStateAfterTap(current)
  const steps = distance > viewportHeight * LONG_DRAG_SHARE ? 2 : distance >= STEP_DISTANCE ? 1 : 0
  const index = SHEET_STATES.indexOf(current) + (dy < 0 ? steps : -steps)
  return SHEET_STATES[Math.min(Math.max(index, 0), SHEET_STATES.length - 1)]!
}
