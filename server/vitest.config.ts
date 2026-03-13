import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'], // added lcov so SonarCloud can read it
      reportsDirectory: './coverage',
      exclude: [
        'migrations/**',
        'scripts/**',
        'src/validators/messages.ts', // バリデーションメッセージ定数（テスト不要）
        'src/constants/**', // 定数ファイル一般（テスト不要）
      ],
    },
  },
});
