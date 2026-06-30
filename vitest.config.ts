import { defineConfig } from 'vitest/config';

// Vitest runs the pure logic in src/utils and src/lib. It deliberately does NOT
// load vite.config.ts (PWA / React plugins) — those aren't needed for unit tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/utils/**', 'src/lib/**'],
    },
  },
});
