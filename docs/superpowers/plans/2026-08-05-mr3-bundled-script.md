# MR 3: Клиентский скрипт `/search` — перевод на бандлящийся модуль — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести клиентскую логику `/search` из `is:inline`-скрипта в бандлящийся модуль, чтобы Astro её минифицировал и вынес в кэшируемый чанк, а импорты в неё стали возможны.

**Architecture:** Скрипт перестаёт быть `is:inline` и теряет `define:vars` (эта директива механически отменяет бандлинг). Данные переезжают в отдельный островок `<script type="application/json">`, откуда логика читает их через `JSON.parse`. Сериализация с ручным экранированием живёт отдельной функцией под тестом.

**Поведение страницы не меняется.** Это чистый рефакторинг: те же моки, те же фильтры, те же карточки. Ревьюеру нужно убедиться ровно в двух вещах — выдача работает как раньше, страница похудела примерно на 40%.

**Tech Stack:** Astro 7, Vitest 4, TypeScript 6 strict.

**Спека:** `docs/superpowers/specs/2026-08-05-doctors-search-astro-design.md`, раздел 4.

**Зависит от:** MR 1 (раннер). MR 2 не требуется, но обычно уже влит.

---

## Почему это отдельный MR

`is:inline`-скрипты Astro не обрабатывает: исходник попадает в HTML дословно, с комментариями и отступами. В собранном `dist/client/search/index.html` он занимает 39 330 байт — **48% страницы**. Перевод в бандл даёт минификацию и вынос в файл под годовым `immutable`-кэшем; замер подмены на реальном собранном файле показал 82 110 → 49 078 байт, после gzip 18 534 → 10 759.

Держать это отдельным MR важно потому, что диф получается огромный (переезжает 757 строк), а поведение обязано остаться идентичным. Смешать это со сменой данных — значит потерять возможность проверить и то, и другое.

---

## File Structure

| Файл                                         | Ответственность                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `web/lib/search/serialize.ts` (создать)      | Сериализация данных для JSON-острова с экранированием                   |
| `web/lib/search/serialize.test.ts` (создать) | Тест: строка с `</script>` не разрывает документ                        |
| `web/pages/search.astro` (изменить)          | JSON-остров вместо `define:vars`, бандлящийся скрипт вместо `is:inline` |

---

## Task 1: Безопасная сериализация для JSON-острова

**Files:**

- Create: `/Users/vladimir/Development/healthy-mobile/web/lib/search/serialize.ts`
- Test: `/Users/vladimir/Development/healthy-mobile/web/lib/search/serialize.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/search/serialize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { serializeForJsonIsland } from './serialize'

describe('serializeForJsonIsland', () => {
  it('сериализует обычные данные как JSON', () => {
    const json = serializeForJsonIsland({ items: [{ name: 'Иванов Иван' }] })
    expect(JSON.parse(json)).toEqual({ items: [{ name: 'Иванов Иван' }] })
  })

  it('не оставляет в выводе закрывающий тег script', () => {
    // Название клиники с разметкой разорвало бы документ: браузер закрыл бы
    // островок раньше времени, остаток строки утёк бы в разметку страницы.
    const json = serializeForJsonIsland({
      clinic: 'Зубная фея </script><img src=x onerror=alert(1)>',
    })
    expect(json).not.toContain('</script>')
    expect(json).not.toContain('<img')
  })

  it('переживает открывающий тег и начало комментария', () => {
    const json = serializeForJsonIsland({ a: '<script>', b: '<!--' })
    expect(json).not.toContain('<script>')
    expect(json).not.toContain('<!--')
  })

  it('после экранирования данные читаются без потерь', () => {
    const value = { clinic: 'Зубная фея </script>', note: '<!-- 5 < 6 -->' }
    expect(JSON.parse(serializeForJsonIsland(value))).toEqual(value)
  })

  it('не трогает кириллицу — она весит два байта, а не шесть', () => {
    const json = serializeForJsonIsland({ city: 'Бишкек' })
    expect(json).toContain('Бишкек')
    expect(json).not.toContain('\\u0411')
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/search/serialize.test.ts
```

Ожидается: провал — модуль `./serialize` не найден.

- [ ] **Step 3: Реализовать сериализацию**

Создать `/Users/vladimir/Development/healthy-mobile/web/lib/search/serialize.ts`:

```ts
/**
 * Готовит данные для островка <script type="application/json">.
 *
 * Astro вставляет содержимое такого островка как есть и НЕ экранирует ничего
 * (в отличие от define:vars, где экранирование встроено). Строка вида
 * `</script>` в названии клиники закрыла бы тег раньше времени, а остаток
 * данных утёк бы в разметку — с этого начинается XSS.
 *
 * Экранируем каждый `<`: в JSON это валидная запись того же символа, поэтому
 * JSON.parse на клиенте вернёт исходную строку. Одной заменой закрываются
 * сразу `</script`, `<script` и `<!--`.
 *
 * Голый JSON.stringify вместо этой функции ставить нельзя.
 */
export function serializeForJsonIsland(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec vitest run web/lib/search/serialize.test.ts
```

Ожидается: 5 тестов пройдено.

- [ ] **Step 5: Проверить типы**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm exec tsc -b --noEmit
```

Ожидается: успех. Файл попадает под проверку благодаря `web/lib` в `tsconfig.include` из MR 1.

- [ ] **Step 6: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/lib/search/serialize.ts web/lib/search/serialize.test.ts
git commit -m "feat(search): безопасная сериализация данных для JSON-острова"
```

---

## Task 2: Зафиксировать исходный размер страницы

Без замера «до» нельзя доказать, что MR сделал то, ради чего затевался.

- [ ] **Step 1: Собрать витрину и записать размер**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null 2>&1 && python3 - <<'PY'
import gzip, pathlib
p = pathlib.Path('dist/client/search/index.html')
raw = p.read_bytes()
print(f'search/index.html: {len(raw)} B raw / {len(gzip.compress(raw, 9))} B gzip')
PY
```

Ожидается: порядка 82 000 байт без сжатия, около 18 500 после gzip. Записать фактические числа — они понадобятся в Task 4.

---

## Task 3: Перевести скрипт на бандлящийся модуль

**Files:**

- Modify: `/Users/vladimir/Development/healthy-mobile/web/pages/search.astro` (frontmatter, строка с открытием скрипта, первые строки тела скрипта)

- [ ] **Step 1: Импортировать сериализацию во frontmatter**

В `web/pages/search.astro` в блок импортов добавить:

```ts
import { serializeForJsonIsland } from '../lib/search/serialize'
```

- [ ] **Step 2: Заменить открывающий тег скрипта на островок данных плюс модуль**

Найти строку:

```astro
  <script is:inline define:vars={{ specialtyLabels, doctorItems }}>
```

Заменить на две конструкции:

```astro
  {/* Данные каталога. Отдельный островок, потому что define:vars механически
      отменяет бандлинг: Astro снимает по нему флаг hoist, и скрипт остаётся
      неминифицированным исходником прямо в HTML. */}
  <script
    type="application/json"
    id="search-data"
    is:inline
    set:html={serializeForJsonIsland({ specialtyLabels, doctorItems })}
  />

  <script>
```

- [ ] **Step 3: Прочитать данные внутри скрипта**

Сразу после `(() => {` (первая строка тела скрипта) вставить чтение островка, до объявления `PAGE_LIMIT`:

```js
// Данные приезжают островком <script type="application/json"> — см.
// разметку выше. Раньше их вносил define:vars, но он несовместим с
// бандлингом.
const dataEl = document.getElementById('search-data')
const payload = dataEl && dataEl.textContent ? JSON.parse(dataEl.textContent) : {}
const specialtyLabels = payload.specialtyLabels || {}
const doctorItems = payload.doctorItems || []
```

Остальное тело скрипта не трогать: имена `specialtyLabels` и `doctorItems` сохранены, поэтому весь код ниже продолжает работать без правок.

- [ ] **Step 4: Проверить, что скрипт стал модулем**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -n 'is:inline' web/pages/search.astro
```

Ожидается: ровно одно совпадение — островок с данными. Логика больше не помечена `is:inline`.

- [ ] **Step 5: Собрать и убедиться, что появился чанк**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm build >/dev/null 2>&1 && ls -la dist/client/_astro/ | grep -i 'search'
```

Ожидается: файл вида `search.astro_astro_type_script_index_0_lang.<hash>.js` — минифицированный чанк логики. Если его нет, значит скрипт всё ещё помечен `is:inline` либо где-то остался `define:vars`.

- [ ] **Step 6: Убедиться, что исходник больше не лежит в HTML**

```bash
cd /Users/vladimir/Development/healthy-mobile && grep -c 'Mobile shell refs' dist/client/search/index.html
```

Ожидается: `0`. Это русский комментарий из тела скрипта — пока он в HTML, минификации не произошло.

- [ ] **Step 7: Коммит**

```bash
cd /Users/vladimir/Development/healthy-mobile
git add web/pages/search.astro
git commit -m "perf(search): перевести клиентскую логику в бандлящийся модуль

is:inline-скрипты Astro не минифицирует — 39 КБ исходника с
комментариями лежали прямо в HTML, это 48% страницы. Данные
переехали в JSON-островок: define:vars снимает флаг hoist и
бандлинг с ним невозможен в принципе."
```

---

## Task 4: Проверить, что страница действительно похудела

- [ ] **Step 1: Замерить размер после**

```bash
cd /Users/vladimir/Development/healthy-mobile && python3 - <<'PY'
import gzip, pathlib
html = pathlib.Path('dist/client/search/index.html')
raw = html.read_bytes()
print(f'search/index.html: {len(raw)} B raw / {len(gzip.compress(raw, 9))} B gzip')

chunks = sorted(pathlib.Path('dist/client/_astro').glob('search.astro_*.js'))
for c in chunks:
    b = c.read_bytes()
    print(f'{c.name}: {len(b)} B raw / {len(gzip.compress(b, 9))} B gzip')
PY
```

Ожидается: HTML около 49 000 байт без сжатия (было около 82 000), чанк — порядка 8 000 байт без сжатия. Суммарно первый визит дешевле, повторный — заметно дешевле, потому что чанк лежит под годовым кэшем из `public/_headers`, а HTML — нет.

Если HTML не уменьшился — вернуться к Task 3 Step 6: скрипт не забандлился.

---

## Task 5: Проверить, что поведение не изменилось

Это главный риск MR: переехало 757 строк. Проверка ручная, по собранной витрине.

- [ ] **Step 1: Поднять предпросмотр**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm preview
```

Открыть `http://localhost:4321/search`.

- [ ] **Step 2: Пройти сценарии**

Проверить и отметить каждый:

- [ ] Список врачей отображается сразу при открытии `/search` (скелетон сменяется карточками, пустоты не мелькает)
- [ ] Поиск по строке сужает выдачу
- [ ] Выбор специальности сужает выдачу, счётчик пересчитывается
- [ ] Сортировочные вкладки переключаются и меняют порядок
- [ ] Шторка «Все фильтры» открывается, фильтры применяются, счётчик в кнопке живой
- [ ] Чипы активных фильтров появляются и снимаются по клику
- [ ] Кнопка «назад» в браузере возвращает предыдущее состояние фильтров
- [ ] Прямое открытие `/search?specialty=dentist` применяет фильтр
- [ ] Ссылка с карточки ведёт на страницу врача
- [ ] Ширина окна меньше 768 пикселей — работает мобильная вёрстка, больше — десктопная

- [ ] **Step 3: Проверить консоль**

В консоли браузера не должно быть ошибок. Особое внимание — `JSON.parse`: если островок пуст или неверно экранирован, ошибка вылезет именно там.

- [ ] **Step 4: Проверить страницу без JavaScript**

Отключить JS в инструментах разработчика и перезагрузить `/search`.

Ожидается: скелетон загрузки, форма поиска работает как обычная GET-форма. Список врачей не отображается — это существующее ограничение страницы, а не регресс данного MR; оно зафиксировано в спеке.

- [ ] **Step 5: Прогнать все проверки**

```bash
cd /Users/vladimir/Development/healthy-mobile && pnpm test && pnpm typecheck && pnpm lint && pnpm fmt:check && pnpm fsd
```

Ожидается: всё зелёное.

---

## Готовность MR

- [ ] Логика `/search` уехала в минифицированный чанк, в HTML её исходника нет
- [ ] Данные передаются JSON-островком, сериализация покрыта тестом на разрыв тега
- [ ] `search/index.html` похудел примерно на 40%
- [ ] Поведение выдачи не изменилось ни в одном сценарии из Task 5
- [ ] Ошибок в консоли нет

**Следующий MR:** `2026-08-05-mr4-simplify-search.md` — удаление функциональности, под которой нет данных, и вынос логики в тестируемые модули.
