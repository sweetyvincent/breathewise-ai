import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: { NODE_ENV: 'test' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/*.d.ts', 'src/store/supabaseStore.ts', 'src/services/ai/llm.ts'],
      reporter: ['text-summary', 'lcov'],
      thresholds: { lines: 88, statements: 88, functions: 88, branches: 78 },
    },
  },
});
