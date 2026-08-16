/**
 * Снимок врача лежит в чужом хранилище: ссылка протухает, объект пропадает, а
 * пустая рамка в карточке читается как сломанная вёрстка. На ошибке загрузки
 * место снимка занимают инициалы — та же подложка, что у врачей без фото.
 *
 * Оба состояния уже стоят в разметке подряд: сначала <img>, следом скрытая
 * подложка. Порядок несущий — подложку ищут соседом снимка.
 */

export function watchAvatar(img: HTMLImageElement): void {
  if (img.src === '') return

  // Снимок мог отвалиться до того, как скрипт дошёл до элемента: error не
  // всплывает и второй раз не повторится, а у такой картинки complete уже
  // выставлен при нулевом размере.
  if (img.complete && img.naturalWidth === 0) showInitials(img)
  else img.addEventListener('error', () => showInitials(img), { once: true })
}

export function watchAvatars(root: ParentNode = document): void {
  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-avatar-img]')) {
    watchAvatar(img)
  }
}

function showInitials(img: HTMLImageElement): void {
  img.hidden = true
  const initials = img.nextElementSibling
  if (initials instanceof HTMLElement) initials.hidden = false
}
