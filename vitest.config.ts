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
    environment: 'node',
    globals: false,
    passWithNoTests: true,
    include: ['src/**/*.test.ts', 'web/**/*.test.ts'],
    // В vitest 4 дефолтный exclude — только node_modules и .git. Вложенные
    // worktree в .claude держат собственные node_modules: прогонять чужую
    // ветку своими зависимостями смысла нет.
    exclude: [...configDefaults.exclude, '**/dist/**', '**/.astro/**', '**/.claude/**'],
  },
})
