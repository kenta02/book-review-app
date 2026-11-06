---
id: "code-review-testing"
name: "コードレビュー: テスト戦略"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["code-review", "testing"]
description: "コードレビュー時のテスト戦略、ユニットテスト、テストカバレッジ、PRチェック項目のガイド"
---

# コードレビュー：テスト戦略

## 🎯 目的

テスト観点の確認を確実にするためのチェックリスト。

---

## 2️⃣ テスト戦略チェック

### ユニットテスト

**フロントエンド側:**

```
✓ Vitest + React Testing Library を使用
✓ コンポーネントの主要ロジック・エッジケースをカバー
✓ ユーザー操作（クリック、入力）をシミュレート
```

**バックエンド側:**

```
✓ Vitest + Supertest で API テスト
✓ Happy path + エラーケースをカバー
✓ データベース操作は test DB で実行（またはモック）
✓ 認証・認可ロジックのテスト
```

**チェック例（React）：**

```typescript
// ✅ 良い例
describe("BookCard", () => {
  it("書籍情報を正しく表示する", () => {
    const { getByText } = render(<BookCard book={mockBook} />);
    expect(getByText(mockBook.title)).toBeInTheDocument();
  });

  it("クリック時にレビュー詳細へ遷移する", async () => {
    const { getByRole } = render(<BookCard book={mockBook} />);
    await userEvent.click(getByRole("link", { name: /view review/i }));
    expect(navigateTo).toHaveBeenCalledWith(`/review/${mockBook.id}`);
  });
});
```

### テストカバレッジ

```
✓ 全体カバレッジ 80% 以上を目標
✓ クリティカルパス（認証、データ操作）は 90% 以上
✓ E2E テストで主要ユーザーフロー（ログイン→レビュー投稿）をカバー
✓ カバレッジレポートは CI で自動生成・公開
```

### PR チェック項目

```
□ 新機能に テスト コードがあるか
□ 既存テストが壊れていないか
□ テストカバレッジが低下していないか
□ テストデータ・モックが適切か
```
