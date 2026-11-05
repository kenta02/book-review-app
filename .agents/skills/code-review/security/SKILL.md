---
id: "code-review-security"
name: "コードレビュー: セキュリティ"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["code-review", "security"]
description: "コードレビュー時のセキュリティチェック（認証・認可、インジェクション、XSS、CSRF、データ保護など）"
---

# コードレビュー：セキュリティ

## 🎯 目的

セキュリティ観点のチェックが漏れないようにする。

---

## 3️⃣ セキュリティチェック

### 認証・認可

```
✓ JWT トークンが正しく検証されている
✓ 認可チェック（ユーザー自身のデータのみ変更可）が実装されている
✓ Protected routes は middleware で保護されている
✓ Secret キー・API キーはプレーンテキスト❌、環境変数で管理
```

**チェック例：**

```typescript
// ❌ 危険
const apiKey = "sk_live_abc123"; // コミットするな！

// ✅ 安全
const apiKey = process.env.VITE_API_KEY;

// ✓ 認可チェック
app.delete("/api/reviews/:id", authenticateUser, async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (review.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" }); // 自分のレビュー以外は削除不可
  }

  await review.delete();
  res.json({ success: true });
});
```

### SQL インジェクション / NoSQL インジェクション

```
✓ Sequelize の ORM メソッド / replacements を使用 → プレースホルダで保護
✓ Raw SQL を使う場合は parameterized queries で必ず書く
✓ フロントエンドの入力値は trust しない（validation）
```

**チェック例：**

```typescript
// ❌ 危険（生のクエリ）
const [rows] = await sequelize.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ 安全（Sequelize ORM）
const user = await User.findByPk(userId);

// ✅ 安全（Raw SQL は replacements でバインド）
const rows = await sequelize.query('SELECT * FROM users WHERE id = :id', {
  replacements: { id: userId },
  type: QueryTypes.SELECT,
});

// ✓ バリデーション
const { email } = z.object({ email: z.string().email() }).parse(req.body);
```

### XSS（クロスサイトスクリプティング）

```
✓ React は JSX でエスケープされている（セーフ）
✓ dangerouslySetInnerHTML は絶対に避ける or サニタイズ必須
✓ ユーザー入力を HTML として表示しない
```

### CSRF 対策

```
✓ POST/PUT/DELETE は CSRF トークン検証 or SameSite Cookie
✓ API はトークンベース認証（JWT）を使用
```

### Data Protection

```
✓ パスワードはハッシュ化（bcrypt など）で保存
✓ PII（個人識別情報）は暗号化して保存
✓ ログには機密情報を出力しない
✓ エラーレスポンスは詳細を隠す（"Invalid username or password" など）
```

**チェック例：**

```typescript
// ❌ 悪い例
console.log(`User login failed: ${email}, password mismatch`); // パスワード露出

// ✅ 良い例
console.log(`User login attempt failed for ${email}`); // メールのみ

// ✓ エラーレスポンス
res.status(401).json({ error: "Invalid credentials" }); // ユーザー存在有無を隠す
```
