# Security - 実装例

## 認証フロー（JWT）

```typescript
// ログイン
POST /api/auth/login
Request: { email, password }
成功時: user（id, username, email, role）と token

// 認証が必要な API
GET /api/auth/me
Headers: { Authorization: 'Bearer <token>' }
```

## ルートでの認証・認可

```typescript
// server/src/routes/books.ts
router.post('/', authenticateToken, requireAdmin, createBook);
```

## 本人か管理者かの確認（service 層）

```typescript
// server/src/services/review.service.ts と同じ形
const isAdmin = requesterRole === 'admin';
if (!isAdmin && Number(review.get('userId')) !== Number(userId)) {
  throw new ApiError(403, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN_REVIEW_UPDATE);
}
```

## パスワードのハッシュ化

```typescript
// 登録時
const hashedPassword = await bcrypt.hash(password, 10);

// ログイン時（失敗理由は区別せず返す）
const isPasswordValid = await bcrypt.compare(password, storedHash);
if (!isPasswordValid) {
  throw new ApiError(401, 'AUTHENTICATION_FAILED', ERROR_MESSAGES.AUTHENTICATION_FAILED);
}
```

## 環境変数（server/.env の例）

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=app
DB_PASS=change-me
DB_NAME=book_review
JWT_SECRET=change-me
CORS_ORIGINS=http://localhost:3000
```

## SQL インジェクション対策（Sequelize）

```typescript
// 安全: ORM のメソッドはパラメータ化される
const user = await User.findOne({ where: { email: userInput } });

// 安全: 生の SQL は replacements でバインドする
const rows = await sequelize.query('SELECT * FROM users WHERE email = :email', {
  replacements: { email: userInput },
  type: QueryTypes.SELECT,
});

// 危険: 文字列の連結
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

## XSS 対策（React）

```tsx
// 安全: React は自動でエスケープする
<div>{user.username}</div>

// 使わない
<div dangerouslySetInnerHTML={{ __html: user.username }} />
```
