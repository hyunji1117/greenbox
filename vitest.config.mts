// vitest.config.mts
// 단위 테스트 설정. 훅 테스트를 위해 jsdom에서 돌리고, '@/' 경로는 tsconfig와 맞춘다.

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  // tsconfig는 Next를 위해 jsx: preserve라서, 테스트에서는 직접 변환한다
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'public'],
  },
});
