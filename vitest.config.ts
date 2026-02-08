import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: [
      'apps/mobile/**',
      'node_modules/**',
    ],
  },
});
