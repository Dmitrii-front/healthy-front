import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// Отдельный конфиг, а не getViteConfig из astro/config: тот тянет плагин
// Cloudflare, который на старте vitest падает несовместимостью окружения ssr
// (vitest ставит туда resolve.external, плагин это запрещает). Тестируем
// чистые функции, поэтому конвейер Astro здесь и не нужен.
export default defineConfig({
  // Astro раздаёт переменные с префиксом PUBLIC_, у Vite по умолчанию только
  // VITE_. Без этой строки import.meta.env.PUBLIC_API_URL в тестах пуст, а
  // shared/config/env.ts подменяет его значением по умолчанию и молчит.
  envPrefix: ['PUBLIC_'],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  test: {
    // Оба совпадают с дефолтами vitest, записаны явно как заявление о намерении:
    // покрываемые функции возвращают данные, DOM им не нужен, а глобалы
    // выключены — describe/it приходят импортом, и файл читается без догадок.
    environment: 'node',
    globals: false,
    // Не дефолт: пустой прогон возвращает 0, а не 1. Иначе pre-commit падал бы
    // на любом коммите без тестов. Цена — опечатка в include пройдёт молча
    // зелёной, поэтому маску стоит проверять глазами при её правке.
    passWithNoTests: true,
    include: ['src/**/*.test.ts', 'web/**/*.test.ts'],
    // include выше заякорен на src/ и web/, поэтому сейчас эти три паттерна
    // ничего не отсекают: пути мимо этих каталогов и так не совпадут. Оставлены
    // на будущее — маска тестов рано или поздно ослабнет до **/*.test.ts, а
    // собранная витрина и вложенные worktree в .claude держат собственные копии
    // исходников.
    exclude: [...configDefaults.exclude, '**/dist/**', '**/.astro/**', '**/.claude/**'],
  },
})
