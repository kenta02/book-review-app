---
id: "testing"
name: "テスト戦略"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["test", "vitest", "e2e"]
description: "ユニット・統合・E2E テストの方針と使用ツールに関するガイドライン"
---

# テスト戦略

## ユニットテスト

- フロントエンドは Vitest + React Testing Library を使用。
  - 例: `BookCard.tsx` や `ReviewForm.tsx` の振る舞いを検証。
- サーバーは Vitest + Supertest で API テスト。
  - 例: `/api/books` の検索条件、`/api/reviews` 投稿処理を確認。
- モック: 外部 API（Google Books API など）はテスト用スタブに差し替える。モック用ライブラリは指定なし（必要になった時点で選定）。

## E2E

- Playwright などを検討し、主要フローをカバー（ログイン→書籍一覧→レビュー投稿）。
- テストデータは Fixtures で管理し、CI では SQLite メモリ DB を利用。
  - サンプル書籍データやレビューを用意する。

## テストカバレッジ

- カバレッジ閾値は 80% 以上を目標とする。
- レポートは `coverage/` に出力し、CI で公開。
