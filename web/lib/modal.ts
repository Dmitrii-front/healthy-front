/**
 * Native <dialog> controller. Browser handles focus trap, ARIA roles, scroll
 * lock, return focus, and Esc by default. We add:
 *   - light-dismiss on backdrop click
 *   - `data-locked` flag that suppresses both backdrop and Esc dismissal
 *     while async work runs
 *
 * Each modal root is a <dialog class="hm-dialog"> element.
 */

export function openModal(dialog: HTMLDialogElement, opts: { locked?: boolean } = {}): void {
  dialog.dataset.locked = opts.locked ? 'true' : 'false'
  if (!dialog.open) {
    dialog.showModal()
  }
}

export function closeModal(dialog: HTMLDialogElement): void {
  dialog.dataset.locked = 'false'
  if (dialog.open) {
    dialog.close()
  }
}

export function lockModal(dialog: HTMLDialogElement, locked: boolean): void {
  dialog.dataset.locked = locked ? 'true' : 'false'
}

/**
 * Wires backdrop click and gates Esc on `data-locked`. Call once per dialog.
 * Returning focus to the trigger is handled natively by the browser.
 */
export function bindModalDismiss(dialog: HTMLDialogElement): void {
  // Backdrop click: when the click target IS the dialog itself, the user
  // clicked the ::backdrop (the dialog's content lives in inner children, so
  // a click on the actual children targets a child element).
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return
    if (dialog.dataset.locked === 'true') return
    closeModal(dialog)
  })

  // Esc: native dialog fires a `cancel` event which we intercept while locked.
  dialog.addEventListener('cancel', (event) => {
    if (dialog.dataset.locked === 'true') {
      event.preventDefault()
    }
  })

  // Re-sync state on close (whether triggered natively, by close() or by Esc).
  dialog.addEventListener('close', () => {
    dialog.dataset.locked = 'false'
  })
}
