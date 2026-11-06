---
id: "code-review-coding-standards"
name: "コードレビュー: コーディング規約"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["code-review", "coding-standards"]
description: "コードレビュー時の命名規則、型安全、JSDoc などコーディング規約のチェックリスト"
---

# コードレビュー：コーディング規約

## 🎯 目的

コーディング規約に関するチェックリストをまとめ、レビュー時の確認漏れを防ぐ。

---

## 1️⃣ コーディング規約チェック

### ファイル名・ディレクトリ

```
✓ コンポーネント: PascalCase (src/components/BookCard.tsx)
✓ ユーティリティ/API: camelCase (src/utils/parseDate.ts, src/api/fetchBooks.ts)
✓ ディレクトリ: kebab-case (src/user-profile/, src/book-detail/)
✓ 定数: UPPER_SNAKE_CASE (const MAX_RETRY = 3)
✓ クラス名: PascalCase (class UserService, class BookRepository)
```

**チェック例：**

```typescript
// ❌ 悪い例
const BookCard = () => { ... }  // src/book-card.tsx でならOK
const get_reviews = () => { ... }  // snake_case は避ける

// ✅ 良い例
const BookCard = () => { ... }  // src/components/BookCard.tsx
const getReviews = () => { ... }  // camelCase
```

### 型安全性

```
✓ TypeScript の tsc で型チェック通過
✓ any 型の使用を最小限に（理由をコメント付きで）
✓ null/undefined チェックが明示的  → Optional chaining (?.), Nullish coalescing (??)
✓ Union 型は正しく絞り込まれている
```

**チェック例：**

```typescript
// ❌ 避ける
function getValue(obj: any) {
  return obj.value; // 型安全でない
}

// ✅ 推奨
function getValue(obj: { value: string }): string {
  return obj?.value ?? "N/A";
}
```

### JSDoc コメント

```
✓ 公開関数・エクスポート型には JSDoc 記載
✓ @param, @returns, @throws 明示
✓ 複雑なロジックには説明コメント // TODO, // FIXME は翌リリースまで放置 ❌
```

**チェック例：**

```typescript
/**
 * 書籍IDでレビュー一覧を取得する
 * @param bookId - 対象の書籍ID
 * @param page - ページ番号（デフォルト: 1）
 * @returns {Promise<Review[]>} レビュー配列
 * @throws {Error} 書籍が見つからない場合
 */
const getReviewsByBookId = async (
  bookId: string,
  page: number = 1,
): Promise<Review[]> => {
  // 実装
};
```
