interface BookCardProps {
  // title: string;
  // author: string;
  // ratingDisplay: string;
  // description: string;
  // isbn: string;
  // publishYear: string;
  // liked?: boolean;
}

export function BookCard(
  {
    // title,
    // author,
    // ratingDisplay,
    // description,
    // isbn,
    // publishYear,
    // liked = false,
  }: BookCardProps,
) {
  return (
    <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
      {/* グラデーション背景のヘッダー部分 */}
      <div className="relative bg-gradient-to-br from-violet-600 to-purple-600 h-48 flex items-center justify-center">
        <h3 className="text-white text-center text-lg font-bold px-4 line-clamp-3">
          人を動かす
        </h3>
        {/* ハートアイコン */}
        <button
          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="いいね"
        >
          🤍
        </button>
      </div>

      {/* カード本体 */}
      <div className="p-4">
        {/* タイトル */}
        <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1 line-clamp-2">
          人を動かす
        </h4>

        {/* 著者名 */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
          デール・カーネギー
        </p>

        {/* 評価 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-400">⭐</span>
          <span className="text-gray-900 dark:text-white font-semibold text-sm">
            5.0 (15件のレビュー)
          </span>
        </div>

        {/* 説明文 */}
        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-3">
          人間関係の古典的名著。人に好かれ、人を説得し、人を変える原則をわかりやすく説いています。
        </p>

        {/* ISBN と出版年 */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
          <span>📅 1936年</span>
          <span>ISBN: 9784422210517</span>
        </div>
      </div>
    </div>
  );
}
