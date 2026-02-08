import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@ujuz/config', replacement: path.resolve(__dirname, 'packages/config/src') },
      { find: '@ujuz/db', replacement: path.resolve(__dirname, 'packages/db/src') },
      { find: '@ujuz/shared', replacement: path.resolve(__dirname, 'packages/shared/src') },
    ],
  },
  test: {
    globals: true,
  },
});
