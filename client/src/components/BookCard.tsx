import { useNavigate } from "react-router-dom";

interface BookCardProps {
  title: string;
  author: string;
  ratingDisplay: string;
  summary: string;
  ISBN: string;
  publicationYear: number;
  bookId: number;
  liked?: boolean;
}

export function BookCard({
  title,
  author,
  ratingDisplay,
  summary,
  ISBN,
  publicationYear,
  bookId,
  liked = false,
}: BookCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/books/${bookId}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 cursor-pointer"
    >
      {/* グラデーション背景のヘッダー部分 */}
      <div className="relative bg-gradient-to-br from-violet-600 to-purple-600 h-48 flex items-center justify-center">
        <h3 className="text-white text-center text-lg font-bold px-4 line-clamp-3">
          {title}
        </h3>
        {/* ハートアイコン */}
        <button
          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="いいね"
          onClick={(e) => e.stopPropagation()}
        >
          {liked ? "❤️" : "🤍"}
        </button>
      </div>

      {/* カード本体 */}
      <div className="p-4">
        {/* タイトル */}
        <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1 line-clamp-2">
          {title}
        </h4>

        {/* 著者名 */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
          {author}
        </p>

        {/* 評価 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-400">⭐</span>
          <span className="text-gray-900 dark:text-white font-semibold text-sm">
            {ratingDisplay}
          </span>
        </div>

        {/* 説明文 */}
        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-3">
          {summary}
        </p>

        {/* ISBN と出版年 */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
          <span>📅 {publicationYear}年</span>
          <span>ISBN: {ISBN}</span>
        </div>
      </div>
    </div>
  );
}
