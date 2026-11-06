# Architecture - 実装例

## ディレクトリ構造例

```
book-review-app/
├── client/
│   └── src/
│       ├── components/
│       │   ├── common/        # 汎用コンポーネント (Header, Footer, etc)
│       │   ├── layouts/       # レイアウトコンポーネント
│       │   ├── features/      # 機能別コンポーネント
│       │   │   ├── books/
│       │   │   ├── reviews/
│       │   │   └── auth/
│       │   └── ui/            # UI ライブラリコンポーネント
│       ├── pages/             # ページコンポーネント
│       ├── hooks/             # Custom Hooks
│       ├── api/               # API クライアント
│       ├── types/             # TypeScript 型定義
│       └── utils/             # ユーティリティ関数
├── server/
│   └── src/
│       ├── controllers/       # リクエストハンドラ
│       ├── services/          # ビジネスロジック層
│       ├── repositories/      # データアクセス層
│       ├── models/            # Sequelize モデル
│       ├── middleware/        # Express ミドルウェア
│       ├── routes/            # ルート定義
│       └── types/             # 型定義
└── docs/                      # ドキュメント
```

## モジュール分離例

### フロントエンド：機能別に分離

```typescript
// src/features/reviews/
├── components/
│   ├── ReviewList.tsx
│   ├── ReviewCard.tsx
│   └── ReviewForm.tsx
├── hooks/
│   ├── useReviewList.ts
│   └── useReviewForm.ts
├── api/
│   └── reviewApi.ts
├── types/
│   └── index.ts
└── store/
    └── reviewStore.ts
```

### バックエンド：レイヤー毎に分離

```typescript
// src/features/reviews/
├── controllers/
│   └── reviewController.ts
├── services/
│   └── reviewService.ts
├── repositories/
│   └── reviewRepository.ts
├── types/
│   └── index.ts
└── routes/
    └── reviewRoutes.ts
```

## 依存関係マップ

```
Pages (ページ)
  ↓
Features (機能別コンポーネント)
  ↓
Components (汎用コンポーネント)
  ├→ Hooks (状態とロジック)
  │   ├→ Store (グローバル状態)
  │   └→ API (サーバー通信)
  └→ Utils (ヘルパー関数)
```
