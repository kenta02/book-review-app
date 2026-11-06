# 指示書

## プロジェクト概要

- アプリ名: ブックレビュー管理システム
- 構成: モノレポ（`client` / `server`）
- フロントエンド: React + TypeScript + Vite + Tailwind CSS + axios + react-router-dom
- バックエンド: Node.js + Express + TypeScript + Sequelize + MySQL
- 認証: JWT
- 仕様の一次情報: `kadai.txt`（リポジトリ直下）

## ディレクトリ構成

- `client`: フロントエンド実装
- `server`: API / DB / 認証 / テスト
- `docs`: プロジェクト内ドキュメント（補助資料）
- `scripts`: 補助スクリプト
- `.agents/skills/`: 作業種別ごとのエージェント向け Skill ガイド（後述）

## 参照スキルガイド

特定のタスクを実行する際は、対応する Skill ファイルを確認してから作業を開始すること。
Skill の参照先は絶対パスで固定せず、以下の優先順で確認すること。

1. `book-review-app/.agents/skills/`
2. 補助ドキュメントも必要な場合は `../docs/.github/skills/`

| タスク種別               | Skill パス候補                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| アーキテクチャ・構成確認 | `.agents/skills/architecture/SKILL.md` / `../docs/.github/skills/architecture/SKILL.md`               |
| UI 実装・スタイリング    | `.agents/skills/ui-design/SKILL.md` / `../docs/.github/skills/ui-design/SKILL.md`                     |
| バックエンド連携・認証   | `.agents/skills/backend-integration/SKILL.md` / `../docs/.github/skills/backend-integration/SKILL.md` |
| コーディング規約         | `.agents/skills/coding-standards/SKILL.md` / `../docs/.github/skills/coding-standards/SKILL.md`       |
| テスト実装・回帰確認     | `.agents/skills/testing/SKILL.md` / `../docs/.github/skills/testing/SKILL.md`                         |
| コミット作成             | `.agents/skills/create-commit/SKILL.md`                                                               |
| PR 作成                  | `.agents/skills/create-pr/SKILL.md`                                                                   |
| Issue 作成               | `.agents/skills/create-issue/SKILL.md`                                                                |

## 実装計画と進捗管理

- 実装計画の管理先: `../docs/projects/book-review-app/specs/implementation`
- 進捗管理の管理先: `../docs/projects/book-review-app/specs/進捗管理`
- 本リポジトリ内の `docs` は補助資料として扱い、計画・進捗の正本は上記 2 フォルダを優先すること。

## ブランチ戦略

ブランチ命名・マージルールは `docs/specs/BRANCH_STRATEGY.md` を参照すること。
新機能・修正のコミット前に、作業ブランチが戦略に準拠しているか確認すること。

## コミット規約

形式: `[TYPE] 説明（日本語）`

- `[ADD]`: 新機能追加・新規ファイル作成
- `[FIX]`: バグ修正
- `[REFACTOR]`: 機能変更を伴わない整理
- `[DOCS]`: ドキュメント更新
- `[TEST]`: テストの追加・変更
- `[STYLE]`: インデント・空白などのスタイル修正
- `[PERF]`: パフォーマンス改善
- `[CHORE]`: 依存更新・設定変更などその他

例: `[ADD] ユーザー検索機能の実装`

## 開発コマンド

### ルート

- `pnpm install --frozen-lockfile`: workspace 全体の依存関係をインストール
- `pnpm run test`: workspace ロックファイルの整合性検証
- `pnpm run seed-demo`: デモデータ投入（`server` に委譲）

### client

- `cd client && pnpm run dev`: 開発サーバー起動
- `cd client && pnpm run build`: ビルド
- `cd client && pnpm run lint`: ESLint

### server

- `cd server && pnpm run dev`: API サーバー起動
- `cd server && pnpm run swagger`: Swagger 用サーバー起動
- `cd server && pnpm run token`: 手動トークン取得（デバッグ用）
- `cd server && pnpm run test`: テスト実行（watch モード）
- `cd server && pnpm run test:ci`: CI 相当テスト（--run）
- `cd server && pnpm run test:ci-parity`: CI 同等テスト（テスト DB 環境変数付き）
- `cd server && pnpm run coverage`: カバレッジ付きテスト
- `cd server && pnpm run lint`: ESLint
- `cd server && pnpm run lint:fix`: ESLint 自動修正
- `cd server && pnpm run format`: Prettier フォーマット
- `cd server && pnpm run check-types`: 型チェック
- `cd server && pnpm run db:migrate`: マイグレーション適用（up）
- `cd server && pnpm run db:migrate:down`: マイグレーションロールバック（down）
- `cd server && pnpm run db:migrate:status`: マイグレーション状態確認
- `cd server && pnpm run db:migrate:pending`: 未適用マイグレーション一覧

## コーディング規約

- 関数コンポーネントと Hooks を使用すること（クラスコンポーネント禁止）。
- TypeScript を使用すること。
- コードの品質を保つため、ESLint と Prettier を使用すること。
- API 設計は RESTful にすること。
- CSS は Tailwind CSS のユーティリティクラスを使用すること。
- `any` 型の使用は禁止。適切な型定義を行うこと。
- 再利用性向上のため、コンポーネントや関数を適切に分割すること。
- セキュリティベストプラクティスを遵守すること（入力バリデーション・サニタイズ必須）。
- テストコードを必ず書くこと。
- 非同期処理は `async/await` を使用すること（Promise チェーン禁止）。
- API レスポンスやドキュメントを正確に参照し、ハルシネーションを避けること。
- YAGNI を守ること。
- コメント・コメントアウトは日本語で残すこと。
- API のエラーレスポンス（エラーメッセージ含）は英語とすること。
- フロントエンドのユーザー表示エラーメッセージは日本語とすること。

## テスト方針

### レイヤー別テスト方針

| レイヤー                 | ツール                         | 配置先                                           | 対象                                          |
| ------------------------ | ------------------------------ | ------------------------------------------------ | --------------------------------------------- |
| サーバー単体・統合テスト | Vitest                         | `server/tests/`                                  | Controller / Service / Middleware / Validator |
| クライアント単体テスト   | Vitest + React Testing Library | `client/src/**/__tests__/` または `*.test.ts(x)` | コンポーネント / hooks / utils                |
| マイグレーションテスト   | Vitest（SQLite in-memory）     | `server/tests/migrations.test.ts`                | DB スキーマ変更の検証                         |

### テスト環境

- サーバーテストの DB は SQLite（in-memory）を使用。MySQL 固有の挙動に依存しないこと。
- `test:ci-parity` を使う場合は環境変数（`DB_NAME`、`DB_USER`、`DB_PASS` 等）が必要。

### テスト実装の必須観点

- 正常系は最低 1 ケース記述すること。
- 異常系・バリデーション違反ケースを必ず含めること。
- 認証・認可を伴う処理は「未認証（401）」「権限不足（403）」の両ケースをテストすること。

## アーキテクチャ方針

- レイヤーを意識して責務分離すること（UI / API / ドメイン / データアクセス）。
- `client` と `server` で型・契約の不整合を起こさないこと。
- DB 変更はマイグレーション前提で管理し、手作業変更を避けること。
- 認証・認可を伴う処理は「未認証」「権限不足」の失敗ケースを必ずテストすること（→ テスト方針も参照）。

## ドキュメント駆動開発

### 基本方針

- 実装前に「何を作るか」「なぜ必要か」「どう検証するか」を文章化する。
- コードはドキュメントの実装結果と位置づけ、仕様変更時はコードより先にドキュメントを更新する。
- 1 機能 1 ドキュメント（または 1 セクション）で追跡可能にする。

### 変更フロー

1. `kadai.txt` と既存仕様を確認し、対象機能の要求を確定する。
2. 実装前に仕様差分を `implementation` へ追記する（背景・スコープ・入出力・制約・受け入れ基準・テスト観点）。
3. API 変更がある場合はエンドポイント契約（リクエスト/レスポンス/エラー）を先に記述する。
4. テスト観点（正常系/異常系/権限/バリデーション）を先に列挙する。
5. 実装後、進捗を `進捗管理` へ反映し、ドキュメント・テスト・コードの整合性を確認する。
6. **判断に迷う場合は**「前提・選択肢・採用理由」を `implementation` へ短く残してから進めること。

### 記載テンプレート（最小）

- 背景: なぜこの変更が必要か
- スコープ: 何を変更し、何を変更しないか
- 仕様: UI/API/DB の変更点
- 受け入れ基準: 完了条件を箇条書き
- テスト観点: 正常系・異常系・境界値
- 未解決事項: 保留中の論点

### 完了定義（DoD）

- ドキュメント更新済み
- 実装済み
- テスト追加・更新済み（対象機能の全テスト + 認証関連テストが通過）
- `lint` / `check-types` / `test:ci` が通過
- 仕様と実装の差分がない

## ドキュメント管理ポリシー

### ⚠️ ファイル保存前の必須確認

ドキュメントを保存する前に、必ず内容をユーザーに提示し、修正が必要なら指摘を受けること。
確認なく保存してはならない。

### 自動保存ガイド

プロンプトで「ドキュメント記録して」「ドキュメントに残して」などとある場合、以下に従って保存する：

| 内容                       | 保存先                | 命名規則                             |
| -------------------------- | --------------------- | ------------------------------------ |
| 新機能・変更の実装手順     | `specs/implementation/` | `[内容]実装計画.md`                  |
| 課題の調査・分析メモ       | `specs/implementation/` | `[内容]調査メモ.md`                  |
| 進捗状況・完了報告         | `specs/進捗管理/`     | `[領域]進捗.md` (既存ファイルに追記) |
| リファクタリング・改善計画 | `specs/implementation/` | `[領域]リファクタリング計画.md`      |
| 問題の発見・修正方針       | `specs/implementation/` | `[内容]修正方針.md`                  |

### 保存先選択フロー

1. **「実装する」「修正する」「追加する」** → `specs/implementation/`（新規ファイル作成）
2. **「完了した」「進捗」「報告」「状況をまとめて」** → `specs/進捗管理/`（既存ファイル更新）
3. **「理由を調べて」「原因を分析して」「検討して」** → `specs/implementation/`（新規メモ作成）
4. **判断に迷った場合** → ユーザーに確認し、その上で保存

### ファイル作成時のルール

- 既存ファイルがある場合 → そこに追記
- 新規作成の場合 → 上記の命名規則に従う

## 困ったら

- 仕様に困ったら `kadai.md`（`kadai.txt`）を参照すること。
  - 参照先: `../docs/projects/book-review-app/progress/kadai.md`
- 変更フロー手順 6 を参照すること（判断に迷う場合の対応）。
