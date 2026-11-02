import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(
        new URL('./tests/unit/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,mjs}'],
      exclude: [
        'src/**/*.test.{ts,tsx,mjs}',
        'src/**/*.spec.{ts,tsx,mjs}',
        'src/**/*.d.ts',
        'src/**/*.d.mts',
        'src/**/generated/**',
        'src/**/*.generated.{ts,tsx,mjs}',
        'src/**/vendor/**',
        'src/runtime-lab/**',
      ],
      reporter: ['text', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});
