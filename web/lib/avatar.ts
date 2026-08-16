/**
 * A doctor's photo lives in third-party storage: the link goes stale, the object
 * disappears, and an empty frame in a card reads as broken layout. The photo is
 * a layer on top of the initials (see DoctorAvatar.astro), so on a load error it
 * is enough to drop it — the plate is already underneath.
 */

export function watchAvatar(img: HTMLImageElement): void {
  if (img.src === '') return

  const settle = () => {
    // A decoded photo marks the box, and only then does CSS drop the initials.
    // Keying off the mere presence of an <img> instead would strip the plate for
    // the whole fetch — and for good on a request that stalls without erroring.
    if (img.naturalWidth > 0) img.dataset.loaded = ''
    else img.hidden = true
  }

  // The photo may have settled before the script reached the element: neither
  // load nor error bubbles, and neither fires a second time.
  if (img.complete) settle()
  else {
    img.addEventListener('load', settle, { once: true })
    img.addEventListener('error', settle, { once: true })
  }
}

export function watchAvatars(): void {
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-avatar-img]')) {
    watchAvatar(img)
  }
}
