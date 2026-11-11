import type { Review } from "../../types";
import { ReviewForm } from "../reviews/ReviewForm";
import { ReviewItemDetail } from "./ReviewItemDetail";

interface ReviewSectionDetailProps {
  reviews: Review[];
  /** レビューを投稿する書籍の ID */
  bookId: number;
  /** レビューの投稿・編集・削除に成功した後に呼ばれる（一覧と平均評価・件数の再取得用） */
  onReviewChanged: () => Promise<void> | void;
}

/**
 * 書籍詳細のレビューセクション。投稿フォームとレビュー一覧（自分のレビューは編集・削除可）を表示する。
 * @example
 * <ReviewSectionDetail reviews={reviews} bookId={1} onReviewChanged={reload} />
 */
export function ReviewSectionDetail({
  reviews,
  bookId,
  onReviewChanged,
}: ReviewSectionDetailProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          レビュー{" "}
          <span className="text-gray-600 dark:text-gray-400">
            ({reviews.length}件)
          </span>
        </h2>
      </div>
      {/* 投稿フォーム（未ログイン時はログインへの案内） */}
      <ReviewForm bookId={bookId} onSubmitted={onReviewChanged} />
      {/* レビューアイテムを動的に取得する */}
      {reviews.map((review, i) => (
        <ReviewItemDetail
          key={review.id}
          review={review}
          onReviewChanged={onReviewChanged}
          isLastItem={i === reviews.length - 1}
        />
      ))}
    </div>
  );
}
