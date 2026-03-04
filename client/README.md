# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Tailwind CSS

This project now includes Tailwind CSS for utility‑first styling. The configuration files
`tailwind.config.js` and `postcss.config.js` live in the root of the `client` folder and
are already wired into Vite.

> **Note:** the ESLint configuration is pinned to ESLint 9.x to satisfy peer
> dependencies of plugins (`eslint-plugin-react-hooks` etc.). If you update
> eslint yourself, you may need to adjust or reinstall lint-related packages,
> or install with `npm install --legacy-peer-deps` to bypass peer conflicts.
> To install dependencies after pulling from the repository run (ensure you clear any
> existing modules first):

```bash
cd client
rm -rf node_modules package-lock.json yarn.lock
npm install   # or yarn
```

```bash
cd client
npm install
# or yarn
```

The global stylesheet (`src/index.css`) begins with the Tailwind directives
`@tailwind base;`, `@tailwind components;` and `@tailwind utilities;`. Preexisting
custom rules remain below those directives and can be migrated incrementally.

Dark mode is managed by toggling the `dark` class on the `<html>` element (see
`Header.tsx`). Tailwind’s `dark:` modifiers apply appropriately; you can change
the storage key or strategy if you prefer.

Legacy CSS files such as `src/styles/dashboard.css` have been removed – all of the
layout and component styling is now done with Tailwind utility classes. You can
safely delete any other custom styles as you migrate features.

Purge (content) paths are set to include all `.jsx`, `.tsx`, `.js`, and `.ts` files
in `src/` plus the `index.html` template. You can extend the theme or add plugins by
editing `tailwind.config.js`.

Switching existing component CSS to Tailwind classes can be done gradually; there is no
need for an all‑at‑once rewrite.

## 環境変数について

環境変数は `.env.local` ファイルで管理されます（ローカル開発環境用）。`.env.example` を参考に設定してください。

### 利用可能な環境変数一覧

| 変数名          | デフォルト値                | 説明                                                                           |
| --------------- | --------------------------- | ------------------------------------------------------------------------------ |
| `VITE_USE_MOCK` | `true`                      | モック API を使用するか（`true`: モック使用 / `false`: 実 API 使用）           |
| `VITE_API_URL`  | `http://localhost:3000/api` | バックエンド API のベース URL（`VITE_USE_MOCK=false` の場合に使用）            |
| `VITE_DEBUG`    | `true`                      | ブラウザコンソールのデバッグログを表示するか（`true`: 表示 / `false`: 非表示） |

### デバッグログの制御（開発環境 vs 本番環境）

本プロジェクトはカスタムロガーを使用して、環境に応じてコンソール出力を自動制御しています。

```typescript
// src/utils/logger.ts
export const logger = {
  log: (...args) => {
    /* 開発環境でのみ出力 */
  },
  error: (...args) => {
    /* 開発環境でのみ出力 */
  },
  warn: (...args) => {
    /* 開発環境でのみ出力 */
  },
  info: (...args) => {
    /* 開発環境でのみ出力 */
  },
};
```

#### 開発環境（ローカル開発）

```bash
# .env.local
VITE_DEBUG=true
```

`logger.log()` や `logger.error()` などの呼び出しがブラウザコンソールに出力されます。  
**デバッグや問題の追跡に便利です。**

#### 本番環境

```bash
VITE_DEBUG=false
```

すべてのログが自動的に非表示になります。  
**本番環境で機密情報がコンソールに出力されるのを防ぎます。**

### コード内での使用例

```typescript
import { logger } from "../utils/logger";

// 開発環境では出力、本番環境では出力されない
logger.log("デバッグ情報:", data);
logger.error("エラーが発生しました:", error);
```

---

## モック API から実 API への切り替え

開発中、バックエンド API を実装したら、モック API から本物の API に切り替えることができます。

### 切り替え手順

1. **バックエンドサーバーが起動していることを確認**

   ```bash
   cd server
   npm run dev
   ```

   `🚀 API running on http://localhost:3000` のようなログが出ていることを確認

2. **`.env.local` を更新**

   ```bash
   VITE_USE_MOCK=false
   VITE_API_URL=http://localhost:3000/api
   ```

3. **クライアント開発サーバーをリロード**

   ```bash
   cd client
   npm run dev
   # または Ctrl+C で停止して、もう一度起動
   ```

4. **ブラウザをリロード**  
   これで実 API からデータが取得されるようになります。

### トラブルシューティング

**「500エラー」や「データが取得できない」場合：**

- ブラウザの開発者ツール（F12 キー）→ **Console** タブでエラーメッセージを確認
- **Network** タブで API 呼び出しの詳細を確認（404、500、CORS エラーなど）
- サーバー側のコンソールログを確認して、エラーの原因を特定
