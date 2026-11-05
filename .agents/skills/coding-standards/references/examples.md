# Coding Standards - 実装例

## 命名規則例

```typescript
// ファイル名：キャメルケース
bookService.ts
getUserById.ts
calculateReviewScore.ts

// コンポーネント：パスカルケース
BookCard.tsx
ReviewForm.tsx
UserProfile.tsx

// ディレクトリ：ケバブケース
user-profile/
book-review/
common-components/

// 定数：スネークケース（大文字）
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;
const API_TIMEOUT_MS = 5000;

// クラス：パスカルケース
class UserService {}
class BookRepository {}
```

## JSDoc + TypeScript 例

```typescript
/**
 * ユーザーID でユーザー情報を取得する
 * @param {number} userId - ユーザー ID
 * @returns {Promise<User | null>} ユーザーオブジェクト、見つからない場合は null
 * @throws {Error} データベース接続エラー時
 */
const getUserById = async (userId: number): Promise<User | null> => {
  try {
    return await userRepository.findById(userId);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user");
  }
};
```

## コメント例

```typescript
// ✓ いい例
// ユーザーの重複チェック
const isDuplicate = await userRepository.existsByEmail(email);

// ✓ 複雑なロジックには JSDoc
/**
 * レビュー平均スコアを計算（外れ値除外）
 */
const calculateAverageScore = (scores: number[]): number => {
  // 昇順でソート
  const sorted = [...scores].sort((a, b) => a - b);
  // 最小・最大値を除外
  const filtered = sorted.slice(1, -1);
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
};

// ✗ 悪い例
// process data
const data = processData(input);
```

## React Component 例

```typescript
/**
 * 書籍カードコンポーネント
 * @param {BookCardProps} props - プロパティ
 */
interface BookCardProps {
  book: Book;
  onSelect?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  const handleClick = () => {
    onSelect?.(book.id);
  };

  return (
    <article className="rounded-lg border p-4">
      <h2 className="font-bold">{book.title}</h2>
      <p className="text-gray-600">{book.author}</p>
      <button onClick={handleClick}>詳細</button>
    </article>
  );
};
```

## Error Handling 例

```typescript
// ✓ 統一フォーマット
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ✓ カスタムエラーを使用
if (!user) {
  throw new AppError(404, "User not found");
}
```
