import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'happy-dom', coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/**/*.ts'], thresholds: { statements: 90, lines: 90, functions: 80, branches: 80 } } } })
