---
id: "coding-standards"
name: "コーディング規約"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["guidelines","code","typescript","react"]
description: "TypeScript/JavaScript や React、API 設計、テスト等に関する詳細なコーディング規約"
---

# コーディング規約

## 🎯 目的

本書籍レビュー・管理システムに関わるコードを対象とした規約です。
プロジェクト全体で一貫性のあるコードを書くことで、書籍/レビュー機能の可読性・保守性を高め、チーム全体での効率的な開発を実現することを目指します。

---

## 📋 目次

- [共通規約](#共通規約)
- [TypeScript / JavaScript](#typescript--javascript)
- [React](#react)
- [データベース](#データベース)
- [API 設計](#api-設計)
- [セキュリティ](#セキュリティ)
- [ロギング](#ロギング)
- [パフォーマンス](#パフォーマンス)
- [テスト](#テスト)
- [Git / コミット](#git--コミット)
- [環境管理](#環境管理)

---

## 共通規約

### 命名規則

| 対象           | 規則                     | 例                                     |
| -------------- | ------------------------ | -------------------------------------- |
| ファイル名     | キャメルケース           | `userController.ts`, `getBooks.ts`     |
| コンポーネント | パスカルケース           | `UserProfile.jsx`, `BookCard.tsx`      |
| ディレクトリ   | ケバブケース             | `user-profile/`, `book-review/`        |
| 定数           | スネークケース（大文字） | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| クラス名       | パスカルケース           | `UserService`, `BookRepository`        |

### コメント規約

#### ✅ コメント作成時のルール

| 種類             | 形式             | 例                                 |
| ---------------- | ---------------- | ---------------------------------- |
| 単行コメント     | `// 説明`        | `// ユーザーの重複チェック`        |
| 複数行コメント   | `/* 説明 */`     | `/* 複雑なロジック: 〇〇を行う */` |
| TODO             | `// TODO: 説明`  | `// TODO: パフォーマンス最適化`    |
| FIXME            | `// FIXME: 説明` | `// FIXME: エッジケース対応`       |
| 関数ドキュメント | JSDoc 形式       | 下記参照                           |

#### JSDoc の書き方

```typescript
/**
 * ユーザーIDでユーザーを取得する
 * @param {number} id - ユーザーID
 * @returns {Promise<User | null>} ユーザーオブジェクト、見つからない場合はnull
 * @throws {Error} データベース接続エラー
 */
const getUserById = async (id: number): Promise<User | null> => {
  return await User.findByPk(id);
};
```

#### ❌ 悪いコメント例

```typescript
// ❌ 英語コメント
// hash password

// ❌ 非明確なコメント
// process data

// ❌ コード説明的なコメント（コード自体が明確なら不要）
// i を 1 増やす
i++;
```

---

## TypeScript / JavaScript

### 基本ルール

| ルール     | 仕様                 | 理由                     |
| ---------- | -------------------- | ------------------------ |
| インデント | **2 スペース**       | チーム統一、可読性向上   |
| セミコロン | **必須**             | 予期しない動作を防止     |
| クォート   | **シングルクォート** | 統一性、コンシステンシー |
| const/let  | **const 優先**       | 不変性、バグ防止         |

...（中略: ここに前記の長大なガイドラインの全文が続く）...

**最終更新**: 2026 年 1 月 16 日  
**管理者**: 開発チーム
