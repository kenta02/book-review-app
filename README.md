# Book Review App

読書管理・レビュー共有をシンプルに実現するWebアプリ

> 本アプリは“読んで終わり”をなくす書籍レビュー管理サービスです。
> 読了した本を整理・検索・共有し、あなたの読書履歴を次の一冊の発見に変えます。

## バッジ

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?logo=sequelize)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql)
![Vitest](https://img.shields.io/badge/Vitest-1-<COLOR>?logo=vitest)

## 概要

Book Review App は、ユーザーが書籍レビューを投稿・編集・検索・共有できるアプリです。

- ユーザー認証（JWT）
- シンプルなレビューCRUD（タイトル、著者、感想、評価、タグ）
- 検索・フィルタ（タイトル/著者/タグ/評価）
- マイページで自分の投稿を管理
- バックエンドAPI（REST）
- バリデーション・エラーハンドリング

## 主な機能

### レビュー投稿・編集

- 本のタイトル、著者、感想、星評価（1-5）を登録
- タグ付け（例：`#ビジネス`, `#小説`, `#技術`）

### 一覧・検索

- タイトル・著者・タグ・レビュー本文検索
- 評価順 / 新着順ソート
- ページネーション対応

### ユーザー機能

- 新規登録 / ログイン / ログアウト
- JWTで認証保護
- マイレビューの一覧・更新・削除

### 追加・拡張予定希望

- コメント / いいね
- 公開/非公開設定

## 技術スタック

- フロントエンド: React + TypeScript + Vite
- UI: Tailwind CSS + Radix UI
- 状態: Zustand + React Query
- ルーティング: React Router
- バックエンド: Node.js + Express + TypeScript
- DB: MySQL (Sequelize)
- 認証: JWT
- テスト: Vitest + React Testing Library + MSW

## セットアップ

### 前提

- Node.js 18+
- npm または yarn
- MySQL 8+（ローカル / Docker）

### インストール

```bash
git clone <YOUR_REPO_URL>
cd book-review-app
npm install
```

### server 起動

```bash
cd server
cp .env.example .env
# .envにDB設定追加
npm run db:migrate
npm run dev
```

### client 起動

```bash
cd client
cp .env.example .env
npm run dev
```

## 利用可能なコマンド

| コマンド                          | 説明                 |
| --------------------------------- | -------------------- |
| `npm run dev`                     | 開発サーバ起動       |
| `npm run build`                   | 本番ビルド           |
| `npm run lint`                    | ESLint 実行          |
| `npm run test`                    | Vitest 実行          |
| `npm run coverage`                | カバレッジ           |
| `cd server && npm run db:migrate` | マイグレーション適用 |
| `cd server && npm run db:seed`    | シードデータ投入     |

## デプロイ

- フロント: Vercel / Netlify
- バックエンド: Heroku / Docker / Cloud Run
- DB: RDS / Cloud SQL

## 開発運用

- SonarCloud 連携: `scripts/sync-sonarcloud-issues.js`
- PRラベル案:
  - `feature/book-review`, `fix/auth`, `chore/deps`, `test/api`, `refactor/backend`, `docs/readme`, `enhancement/UX`
