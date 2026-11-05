# UI Design - 実装例

## Tailwind CSS コンポーネント例

```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}) => {
  const baseClasses = 'font-semibold rounded-lg transition';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  };
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## 複雑なコンポーネント（モーダル：Tailwind + ARIA）

```typescript
// src/components/features/ReviewModal.tsx
import { ReviewForm } from './ReviewForm';

export const ReviewModal = ({ bookId, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full"
      >
        <h2 id="review-modal-title" className="text-xl font-bold mb-4">
          レビューを書く
        </h2>
        <ReviewForm bookId={bookId} onSubmit={onClose} />
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="mt-4 text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
```

## レスポンシブレイアウト

```typescript
// src/components/layouts/BookGrid.tsx
export const BookGrid = ({ books }) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};
```

## アクセシビリティ（a11y）例

```typescript
interface BookCardProps {
  book: Book;
  onSelect?: (id: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  return (
    <article
      className="rounded-lg border p-4"
      role="article"
      aria-label={`書籍: ${book.title}`}
    >
      <h2 className="font-bold mb-2">{book.title}</h2>
      <p className="text-gray-600 mb-4">{book.author}</p>
      <button
        onClick={() => onSelect?.(book.id)}
        aria-label={`${book.title}の詳細を表示`}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        詳細
      </button>
    </article>
  );
};
```
