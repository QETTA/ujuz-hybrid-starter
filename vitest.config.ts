import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ujuz/config': path.resolve(__dirname, 'packages/config/src/index.ts'),
      '@ujuz/db': path.resolve(__dirname, 'packages/db/src/index.ts'),
      '@ujuz/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
    exclude: [
      'apps/mobile/**',
      'node_modules/**',
    ],
  },
});
