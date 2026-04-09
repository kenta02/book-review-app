import { useNavigate } from "react-router-dom";

interface BookCardProps {
  readonly title: string;
  readonly author: string;
  readonly ratingDisplay: string;
  readonly summary: string;
  readonly ISBN: string;
  readonly publicationYear: number;
  readonly bookId: number;
  readonly liked?: boolean;
}

/**
 * 書籍のカードコンポーネント
 * @param props - 書籍の情報を含むプロパティ
 * @returns - 書籍のカードを表示するReactコンポーネント
 */
export function BookCard(props: Readonly<BookCardProps>) {
  const {
    title,
    author,
    ratingDisplay,
    summary,
    ISBN,
    publicationYear,
    bookId,
    liked,
  } = props;
  const isLiked = liked ?? false;

  const navigate = useNavigate();
  const filledStars = Math.max(
    0,
    Math.min(5, Math.round(Number(ratingDisplay))),
  );
  const reviewCountLabel = "(15 reviews)";

  const handleCardClick = () => {
    navigate(`/books/${bookId}`);
  };

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="book-card"
        onClick={handleCardClick}
        className="flex cursor-pointer flex-col rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg dark:bg-gray-800"
      >
        {/* グラデーション背景のヘッダー部分 */}
        <div className="relative bg-gradient-to-br from-violet-600 to-purple-600 h-40 flex items-center justify-center flex-shrink-0 rounded-t-lg">
          <h3 className="text-white text-center text-lg font-bold px-4 line-clamp-3">
            {title}
          </h3>
        </div>

        {/* カード本体 */}
        <div className="p-4 flex flex-col flex-1">
          {/* タイトル */}
          <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1 line-clamp-2">
            {title}
          </h4>

          {/* 著者名 */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            {author}
          </p>

          {/* 評価 */}
          <div className="mb-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  key={`${bookId}-star-${index}`}
                  className={
                    index < filledStars ? "text-yellow-400" : "text-gray-300"
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {reviewCountLabel}
            </p>
          </div>

          {/* 説明文 */}
          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4">
            {summary}
          </p>

          {/* 出版年 */}
          <div className="mt-auto flex flex-col gap-1 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <span>{publicationYear}年</span>
            <span>ISBN: {ISBN}</span>
          </div>
        </div>
      </button>

      <button
        type="button"
        className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-xl shadow-sm transition hover:scale-105 dark:bg-gray-700"
        aria-label="いいね"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {isLiked ? "❤️" : "🤍"}
      </button>

      <details className="absolute right-3 top-3 z-10">
        <summary className="flex h-10 w-10 list-none items-center justify-center rounded-2xl bg-white text-xl text-gray-600 shadow-md transition hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-100 [&::-webkit-details-marker]:hidden">
          ⋮
        </summary>
        <div className="absolute right-0 mt-2 w-32 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
          >
            編集
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-red-500 transition hover:bg-red-50 hover:text-red-600"
          >
            削除
          </button>
        </div>
      </details>
    </div>
  );
}
