# Security - 実装例

## 認証フロー（JWT）

```typescript
// ログイン処理
POST /api/auth/login
Request: { email, password }
Response: {
  accessToken: 'eyJhbGciOiJIUzI1NiIs...',
  refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
  user: { id, email, name }
}

// API リクエスト
GET /api/books
Headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIs...' }
```

## パスワードハッシング例（バックエンド）

```typescript
import bcrypt from "bcrypt";

// パスワード登録時
const hashedPassword = await bcrypt.hash(password, 12);
await userRepository.create({ email, password: hashedPassword });

// ログイン時のパスワード検証
const user = await userRepository.findByEmail(email);
const isPasswordValid = await bcrypt.compare(password, user.password);
if (!isPasswordValid) {
  throw new AppError(401, "Invalid credentials");
}
```

## CORS 設定例

```typescript
// src/middleware/cors.ts
import cors from "cors";

app.use(
  cors({
    origin: [
      "http://localhost:5173", // 開発環境
      "https://example.com", // 本番環境
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
```

## 環境変数（機密情報）例

```bash
# .env.local (gitignore に追加)
DB_HOST=localhost
DB_PORT=3306
DB_USER=app
DB_PASS=change-me
DB_NAME=book_review
JWT_SECRET=your-super-secret-key-change-in-production
API_KEY=sk-...
```

## SQL インジェクション対策（Sequelize）

```typescript
// ✓ 安全（ORM メソッドはパラメータ化される）
const user = await User.findOne({ where: { email: userInput } });

// ✓ 安全（Raw SQL は replacements でバインド）
const rows = await sequelize.query('SELECT * FROM users WHERE email = :email', {
  replacements: { email: userInput },
  type: QueryTypes.SELECT,
});

// ✗ 危険（文字列連結）
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

## XSS 対策（React）

```typescript
// ✓ React は自動エスケープ
const user = { name: '<script>alert("xss")</script>' };
<div>{user.name}</div>  // 安全にエスケープされる

// ✗ dangerouslySetInnerHTML を避ける
<div dangerouslySetInnerHTML={{ __html: user.name }} />
```
