# 指示書

## プロジェクト概要

- アプリ名: ブックレビュー管理システム
- 構成: モノレポ（`client` / `server`）
- フロントエンド: React + TypeScript + Vite + Tailwind CSS + axios + react-router-dom
- バックエンド: Node.js + Express + TypeScript + Sequelize + MySQL
- 認証: JWT
- 仕様の一次情報: `kadai.txt`（リポジトリ直下）。参照先: `../project-documentation/projects/book-review-app/progress/kadai.md`

## ディレクトリ構成

- `client`: フロントエンド実装
- `server`: API / DB / 認証 / テスト
- `docs`: プロジェクト内ドキュメント（補助資料）
- `scripts`: 補助スクリプト
- `.agents/skills/`: 作業種別ごとの Skill ガイド（`.claude/skills/` は symlink）

## 参照スキルガイド

作業開始前に、対応する Skill（`.agents/skills/<名前>/SKILL.md`）を確認すること。一覧は `.agents/skills/README.md` を参照。

- 名前: `architecture`（構成確認）/ `ui-design`（UI・スタイル）/ `backend-integration`（連携・認証）/ `coding-standards`（規約）/ `testing`（テスト・回帰）/ `create-commit` / `create-pr` / `create-issue`

## 実装計画と進捗管理

- 実装計画: `../project-documentation/projects/book-review-app/specs/implementation`
- 進捗管理: `../project-documentation/projects/book-review-app/specs/進捗管理`
- 本リポジトリ内の `docs` は補助資料。計画・進捗の正本は上記 2 フォルダを優先する。

## ブランチ戦略

命名・マージルールは `../project-documentation/projects/book-review-app/specs/BRANCH_STRATEGY.md` を参照。
コミット前に、作業ブランチが戦略に準拠しているか確認すること。

## コミット規約

形式: `[TYPE] 説明（日本語）`（例: `[ADD] ユーザー検索機能の実装`）

`[ADD]` 新機能・新規ファイル / `[FIX]` バグ修正 / `[REFACTOR]` 機能変更なしの整理 / `[DOCS]` ドキュメント / `[TEST]` テスト / `[STYLE]` 空白等 / `[PERF]` 性能改善 / `[CHORE]` 依存更新・設定等

## 開発コマンド

- ルート: `pnpm install --frozen-lockfile`（依存インストール）/ `pnpm run seed-demo`（デモデータ投入）
- client（`cd client &&`）: `pnpm run dev` / `build` / `lint`
- server（`cd server &&`）: `pnpm run dev` / `test:ci` / `lint` / `check-types` / `format`
- DB: `pnpm run db:migrate`（適用）/ `db:migrate:down` / `db:migrate:status`
- その他のコマンド（`swagger`・`coverage`・`test:ci-parity` 等）は `server/package.json` の scripts を参照。

## コーディング規約

- 関数コンポーネントと Hooks を使用する（クラスコンポーネント禁止）。
- TypeScript を使用し、`any` 型は禁止。適切な型定義を行う。
- ESLint と Prettier を使用する。
- API 設計は RESTful にする。
- CSS は Tailwind CSS のユーティリティクラスを使用する。
- コンポーネントや関数は再利用性を意識して適切に分割する。
- セキュリティベストプラクティスを遵守する（入力バリデーション・サニタイズ必須）。
- 非同期処理は `async/await` を使用する（Promise チェーン禁止）。
- API レスポンスやドキュメントを正確に参照し、ハルシネーションを避ける。
- YAGNI を守る。
- コメント・コメントアウトは日本語で残す。
- API のエラーレスポンス（メッセージ含む）は英語、フロントエンドのユーザー表示エラーメッセージは日本語とする。

## テスト方針

テストコードを必ず書くこと。

| レイヤー                 | ツール                         | 配置先                                           | 対象                                          |
| ------------------------ | ------------------------------ | ------------------------------------------------ | --------------------------------------------- |
| サーバー単体・統合テスト | Vitest                         | `server/tests/`                                  | Controller / Service / Middleware / Validator |
| クライアント単体テスト   | Vitest + React Testing Library | `client/src/**/__tests__/` または `*.test.ts(x)` | コンポーネント / hooks / utils                |
| マイグレーションテスト   | Vitest（SQLite in-memory）     | `server/tests/migrations.test.ts`                | DB スキーマ変更の検証                         |

- サーバーテストの DB は SQLite（in-memory）。MySQL 固有の挙動に依存しない。
- `test:ci-parity` は環境変数（`DB_NAME`、`DB_USER`、`DB_PASS` 等）が必要。
- 必須観点: 正常系 1 ケース以上 / 異常系・バリデーション違反 / 認証・認可を伴う処理は「未認証（401）」「権限不足（403）」の両方。

## アーキテクチャ方針

- UI / API / ドメイン / データアクセスの責務を分離する。
- `client` と `server` で型・契約の不整合を起こさない。
- DB 変更はマイグレーション前提とし、手作業変更を避ける。

## ドキュメント駆動開発

実装前に「何を作るか」「なぜ必要か」「どう検証するか」を文章化する。仕様変更時はコードより先にドキュメントを更新し、1 機能 1 ドキュメント（または 1 セクション）で追跡可能にする。

### 変更フロー

1. `kadai.txt` と既存仕様を確認し、対象機能の要求を確定する。
2. 実装前に仕様差分を `implementation` へ追記する。
3. API 変更がある場合は、エンドポイント契約（リクエスト/レスポンス/エラー）を先に記述する。
4. テスト観点（正常系/異常系/権限/バリデーション）を先に列挙する。
5. 実装後、進捗を `進捗管理` へ反映し、ドキュメント・テスト・コードの整合性を確認する。
6. **判断に迷う場合は**「前提・選択肢・採用理由」を `implementation` へ短く残してから進める。

記載テンプレート（最小）: 背景 / スコープ / 仕様 / 受け入れ基準 / テスト観点 / 未解決事項

### 完了定義（DoD）

- ドキュメント更新済み・実装済み
- テスト追加・更新済み（対象機能の全テスト + 認証関連テストが通過）
- `lint` / `check-types` / `test:ci` が通過
- 仕様と実装の差分がない

## ドキュメント管理ポリシー

- ⚠️ **ドキュメントを保存する前に、必ず内容をユーザーに提示し、修正が必要なら指摘を受けること。確認なく保存してはならない。**
- 保存先（`../project-documentation/projects/book-review-app/specs/` 配下）と命名規則:

| 内容                       | 保存先                  | 命名規則                              |
| -------------------------- | ----------------------- | ------------------------------------- |
| 新機能・変更の実装手順     | `specs/implementation/` | `[内容]実装計画.md`                   |
| 課題の調査・分析メモ       | `specs/implementation/` | `[内容]調査メモ.md`                   |
| 進捗状況・完了報告         | `specs/進捗管理/`       | `[領域]進捗.md`（既存ファイルに追記） |
| リファクタリング・改善計画 | `specs/implementation/` | `[領域]リファクタリング計画.md`       |
| 問題の発見・修正方針       | `specs/implementation/` | `[内容]修正方針.md`                   |

- 既存ファイルがあれば追記し、新規作成の場合は上記の命名規則に従う。
- 保存先に迷う場合はユーザーに確認する。

## superpowers 利用時のルール

- 設計書・実装計画は `docs/superpowers/` ではなく、「ドキュメント管理ポリシー」の保存先と命名規則に従う。
- ドキュメントは保存前にユーザーへ提示し、確認を得る。
- コミット・ブランチ・PR は本書の規約と `.agents/skills/` を優先する。
