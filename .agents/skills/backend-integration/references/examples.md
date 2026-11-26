# Backend Integration - 実装例

## 主なエンドポイント

| メソッド | パス                            | 認証          |
| -------- | ------------------------------- | ------------- |
| POST     | `/api/auth/register`            | 不要          |
| POST     | `/api/auth/login`               | 不要          |
| GET      | `/api/auth/me`                  | 必要          |
| GET      | `/api/books`                    | 不要          |
| GET      | `/api/books/:id`                | 不要          |
| POST     | `/api/books`                    | 管理者        |
| PUT      | `/api/books/:id`                | 管理者        |
| DELETE   | `/api/books/:id`                | 管理者        |
| GET      | `/api/books/:bookId/reviews`    | 不要          |
| GET      | `/api/reviews`                  | 不要          |
| GET      | `/api/reviews/:reviewId`        | 不要          |
| POST     | `/api/reviews`                  | 必要          |
| PUT      | `/api/reviews/:reviewId`        | 本人か管理者  |
| DELETE   | `/api/reviews/:reviewId`        | 本人か管理者  |
| GET      | `/api/reviews/:reviewId/comments` | 不要        |
| POST     | `/api/reviews/:reviewId/comments` | 必要        |
| GET      | `/api/users/:id`                | 不要          |

## ルート定義

```typescript
// server/src/routes/reviews.ts
router.get('/reviews', listReviews);
router.post('/reviews', authenticateToken, createReview);
```

## エラーの送出

```typescript
// service 層
throw new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND);

// 入力エラー（controller で直接返す）
return res.status(400).json({
  success: false,
  error: {
    message: ERROR_MESSAGES.VALIDATION_FAILED,
    code: 'VALIDATION_ERROR',
    details: parseResult.errors,
  },
});
```

## フロントエンドからの呼び出し

```typescript
// client/src/api/apiClient.ts では fetch を使い、withAuthHeader でトークンを付ける
const response = await fetch(url, withAuthHeader({ method: 'POST' }));
if (!response.ok) {
  throw new ApiHttpError(response.status, response.statusText);
}
```
