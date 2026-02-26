import { ReviewItemDetail } from "./ReviewItemDetail";

export function ReviewSectionDetail() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          レビュー <span className="text-gray-600 dark:text-gray-400">(2)</span>
        </h2>
        <button className="py-2 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-blue-700 active:scale-95 transition">
          レビューを書く
        </button>
      </div>

      {/* レビューアイテム 1 */}
      <ReviewItemDetail isLastItem={false} />

      {/* レビューアイテム 2 */}
      <ReviewItemDetail isLastItem={true} />
    </div>
  );
}
