interface ReviewItemDetailProps {
  isLastItem?: boolean;
}

export function ReviewItemDetail({
  isLastItem = false,
}: ReviewItemDetailProps) {
  return (
    <div
      className={`${isLastItem ? "mb-6" : "mb-6 pb-6 border-b border-gray-200 dark:border-slate-700"}`}
    >
      <div className="flex items-start gap-4">
        {/* ユーザーアバター */}
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
          山
        </div>

        {/* レビュー内容 */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                山田太郎
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                2026/2/25
              </p>
            </div>
            <div className="flex">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-yellow-400 text-sm">★</span>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            aaadaadaadaadaad
          </p>
          <div className="flex gap-4 text-sm">
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              <span>👍</span> 役に立つ (0)
            </button>
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              💬 コメント
            </button>
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              ✏️ 編集
            </button>
            <button className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1">
              🗑️ 削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
