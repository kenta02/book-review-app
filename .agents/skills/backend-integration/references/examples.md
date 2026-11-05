# Backend Integration - 実装例

## API エンドポイント例

```typescript
// GET - 書籍一覧取得
GET /api/books
Query: { page: 1, limit: 20, search: 'react' }
Response: { data: Book[], total: 100 }

// GET - 書籍詳細取得
GET /api/books/:id
Response: { data: Book }

// POST - レビュー投稿
POST /api/reviews
Body: { bookId, rating, text }
Response: { data: Review }

// PUT - レビュー更新
PUT /api/reviews/:id
Body: { rating, text }
Response: { data: Review }

// DELETE - レビュー削除
DELETE /api/reviews/:id
Response: { success: true }
```

## API クライアント例（フロントエンド）

```typescript
// src/api/bookApi.ts
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const bookApi = {
  getBooks: (params) => api.get("/books", { params }),
  getBook: (id) => api.get(`/books/${id}`),
  searchBooks: (query) => api.get("/books/search", { params: { q: query } }),
};

// usecase:
const { data } = useQuery(["books"], () => bookApi.getBooks({ page: 1 }));
```

## JWT 認証フロー例

```typescript
// ログイン
POST /api/auth/login
→ Response: { accessToken, refreshToken, user }

// リクエスト
GET /api/books
Headers: { Authorization: 'Bearer <accessToken>' }

// トークンリフレッシュ
POST /api/auth/refresh
Body: { refreshToken }
→ Response: { accessToken }
```

## ミドルウェア例（バックエンド）

```typescript
// src/middleware/auth.ts
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// src/routes/books.ts
app.get("/books", verifyToken, bookController.getBooks);
```
