import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'migrations/**',
        'scripts/**',
        'src/validators/messages.ts',  // バリデーションメッセージ定数（テスト不要）
        'src/constants/**',              // 定数ファイル一般（テスト不要）
      ]
    }
  }
})
