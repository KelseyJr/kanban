import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const SOURCE_FOLDER = new URL('./src/', import.meta.url).pathname

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: { '#/': SOURCE_FOLDER, '@/': SOURCE_FOLDER },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup-tests.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    env: { API_URL: 'http://api.test' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.spec.{ts,tsx}', 'src/test/**', 'src/routeTree.gen.ts', 'src/router.tsx', 'src/routes/**'],
      thresholds: { lines: 80, branches: 80, functions: 80 },
    },
  },
})
