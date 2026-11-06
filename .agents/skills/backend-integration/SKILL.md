---
id: "backend-integration"
name: "バックエンド連携・認証"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["backend","integration","auth"]
description: "API 設計や認証、外部サービスとの連携に関するガイドライン"
---

# バックエンド連携・認証

本書籍レビューアプリの API 設計や認証方式、外部サービスとの連携についてのガイドラインです。

## API

- RESTful 標準に従いエンドポイント設計。リソース名は複数形（例: `/api/books`, `/api/reviews`, `/api/users`）。
- バリデーションは `express-validator` や Zod を使用し、Books/Reviews の入力チェックを重点的に実施。
- エラーレスポンスは統一フォーマット `{ error: string; details?: any }` を返す。

## 認証

- JWT を使用。トークンは Authorization ヘッダーで送信。
- 書籍データへのアクセスはログイン必須。未認証時は `401` を返す。
- CORS 設定は `server/src/middleware/cors.ts` で管理。

## 外部サービス

- 現状では主要な外部連携は不要だが、将来的に Google Books API などと連携する場合は `src/lib` にラッパーを作成。
