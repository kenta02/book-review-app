---
id: "code-review-performance-architecture"
name: "コードレビュー: パフォーマンス & アーキテクチャ"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["code-review", "performance", "architecture"]
description: "コードレビュー時にチェックすべきパフォーマンス、設計原則、要件整合性、障害予防のガイド"
---

# コードレビュー：パフォーマンス & アーキテクチャ

## 🎯 目的

パフォーマンス、設計、堅牢性の観点で品質向上を支援する。

---

### 4️⃣ パフォーマンスチェック

#### データベース

```
✓ N+1 クエリ問題がないか（eager loading/relation load)
✓ 不要な列のセレクト❌ → 必要な列だけ
✓ インデックスが適切に張られているか（主キー、外部キー、検索カラム)
✓ ページングが実装されている（全件取得❌）
```

**チェック例（Sequelize）：**

```typescript
// ❌ N+1 問題（レビューごとにユーザーを取得）
const reviews = await Review.findAll();
for (const review of reviews) {
  review.user = await User.findByPk(review.userId);
}

// ✅ include で一括取得
const reviews = await Review.findAll({ include: [User] });
```

### 5️⃣ 設計原則チェック（SRP / DIP / 情報隠蔽）

```
✓ 各クラス・モジュールは単一責任（SRP）か
✓ 依存性はインターフェース経由（DIP）で注入されているか
✓ 内部状態が外部に露出していないか（情報隠蔽）
✓ 公開 API 以外は `private` / `protected` で制御されているか
✓ 具体実装の抽象化（ビジネスロジックはサービス層、DBはリポジトリ層）
```

**チェック例（Node.js/Express）:**

```typescript
// Route Controller <- Service <- Repository の階層
// Controller は request/response を扱い、ビジネスロジックは Service に委譲
// Repository は DB 操作に特化し、Service から直接参照される
```

### 6️⃣ 要件整合性・再利用性チェック

```
✓ PR が対象要件を参照している（kadai.md, 仕様ID）
✓ 既存機能を再利用しているか（同等機能の重複追加を避けているか）
✓ 新規ロジックが既存モジュールと整合しているか
✓ 変更が影響する箇所を `grep`/`find` で網羅的に確認しているか
```

### 7️⃣ 障害予防チェック

```
✓ エラーハンドリングが網羅されているか（例外が握りつぶされていない）
✓ 再試行・タイムアウト戦略があるか（外部依存API/DB）
✓ 冪等性を意識した設計になっているか（更新系APIなど）
✓ ログ出力で障害原因が追跡可能か、機密情報を含まないか
```
