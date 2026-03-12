import type { Review } from "../../types";
import { ReviewItemDetail } from "./ReviewItemDetail";

interface ReviewSectionDetailProps {
  reviews: Review[];
}

export function ReviewSectionDetail({ reviews }: ReviewSectionDetailProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          レビュー{" "}
          <span className="text-gray-600 dark:text-gray-400">
            ({reviews.length}件)
          </span>
        </h2>
        <button className="py-2 px-6 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white">
          レビューを書く
        </button>
      </div>
      {/* レビューアイテムを動的に取得する */}
      {reviews.map((review, i) => (
        <ReviewItemDetail
          key={review.id}
          review={review}
          isLastItem={i === reviews.length - 1}
        />
      ))}
    </div>
  );
}
