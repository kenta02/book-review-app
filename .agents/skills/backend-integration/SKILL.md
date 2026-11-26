---
name: backend-integration
description: API 設計、認証フロー、外部 API（Google Books など）連携を実装・修正するときに使う
---

# バックエンド連携・認証

本書籍レビューアプリの API 設計や認証方式、外部サービスとの連携についてのガイドラインです。
API 契約は `server/src/openapi.yaml` も参照し、食い違う場合は実装を確認してください。

## API

- RESTful に設計する。ベースパスは `/api`、リソース名は複数形（`/api/books`、`/api/reviews`、`/api/users`）。
- 層は `routes` → `controllers` → `services` → `repositories` の順に分ける。
- 入力は `server/src/validators/` の検証関数で確認する（`express-validator` や Zod は未導入）。
- 成功時は `{ success: true, data }` を返す。
- 入力エラーは controller が `400` を直接返す。業務エラーは service で `ApiError` を投げ、`apiErrorHandler`（`server/src/middleware/errorHandler.ts`）が整形する。エラーの形式は次のとおり。

```typescript
{
  success: false;
  error: {
    message: string; // 英語
    code: string; // 例: 'VALIDATION_ERROR'
    details?: { field: string; message: string }[];
  };
}
```

## 認証

- JWT を `Authorization: Bearer <token>` ヘッダーで送る。有効期限は 30 日で、リフレッシュは未導入。
- 参照系（書籍・レビュー・コメント・ユーザープロフィール）は認証不要。
- 認証が必要なルートは `authenticateToken`、管理者専用は `requireAdmin` を付ける。未認証は `401`、権限不足は `403`。
- 権限の一覧は [セキュリティ・認証](../security/SKILL.md) を参照。
- CORS は `server/src/app.ts` で設定する（環境変数 `CORS_ORIGINS`）。

## フロントエンド連携

- API 呼び出しは `client/src/api/apiClient.ts` にまとめる。トークンは `withAuthHeader` が付与する。
- `VITE_USE_MOCK=true` でモック API に切り替わる。API を追加・変更するときはモックもそろえる。
- 失敗時は `ApiHttpError` を投げ、UI 側で `normalizeError` を通す。

## 外部サービス

- 現状、外部 API の連携はない。
- Google Books API 連携（`docs/kadai.md` の 5-1）は、課題の指定により server 側で Axios を使う（server への追加が必要）。配置は実装前に決める。
