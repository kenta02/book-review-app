# Harness Engineering 実装例

## unit テスト

- `client/src/**/__tests__/*.test.tsx` にコンポーネント単位のテスト追加
- `server/tests/**/*.test.ts` にコントローラー/サービスのテスト追加

## integration テスト

- `server/tests/integration` にエンドツーエンド近い API テスト設置
- MSW や DB in-memory を使って外部依存を制御

## E2E テスト

- `client/e2e` に Playwright/Cypress を追加し、UI フローを確認
- CI で実行し、リリース前に安定性を担保
