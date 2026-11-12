import { useState } from "react";
import { apiClient } from "../../api/apiClient";
import { useAuth } from "../../auth/useAuth";
import { normalizeError } from "../../errors/normalizeError";
import type { Review } from "../../types";
import { ReviewEditForm } from "../reviews/ReviewEditForm";
import { getReviewChangeErrorMessage } from "../reviews/reviewErrorMessage";

interface ReviewItemDetailProps {
  isLastItem?: boolean;
  review: Review;
  /** 編集・削除に成功した後に呼ばれる（一覧と平均評価・件数の再取得用） */
  onReviewChanged: () => Promise<void> | void;
}

/**
 * レビュー1件の表示。自分のレビュー、または管理者のときだけ「編集」「削除」を表示する。
 * - 編集: 本文だけを編集するフォームに切り替える（サーバーが本文しか更新しないため）
 * - 削除: 確認を挟んでから実行する。コメントが付いたレビューは削除できない（サーバーが 409 を返す）
 * @example
 * <ReviewItemDetail review={review} onReviewChanged={reload} />
 */
export function ReviewItemDetail({
  isLastItem = false,
  review,
  onReviewChanged,
}: ReviewItemDetailProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 自分のレビューか（ユーザーが削除済みで userId が null のレビューは誰のものでもない）
  const isOwner =
    user !== null && review.userId !== null && user.id === review.userId;
  // 操作を表示するか: 自分のレビュー、または管理者。
  // 表示の出し分けだけで、権限の判定はサーバーが行う（管理者はサーバーが他人のレビューの更新・削除を許可する）
  const canManage = isOwner || user?.role === "admin";

  /** 編集に成功したとき: 編集モードを閉じて、一覧を再取得する */
  const handleSaved = async () => {
    setIsEditing(false);
    await onReviewChanged();
  };

  /** 削除を実行する。失敗したらエラーを表示し、成功したら一覧を再取得する */
  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.deleteReview({ reviewId: review.id });
    } catch (err) {
      setDeleteError(
        getReviewChangeErrorMessage(normalizeError(err), "delete"),
      );
      setDeleting(false);
      setIsConfirmingDelete(false);
      return;
    }
    setDeleting(false);
    setIsConfirmingDelete(false);
    await onReviewChanged();
  };

  return (
    <div
      className={`${isLastItem ? "mb-6" : "mb-6 pb-6 border-b border-gray-200 dark:border-slate-700"}`}
    >
      <div className="flex items-start gap-4">
        {/* レビュー内容 */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {review.userId || "匿名"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {review.createdAt || "日付不明"}
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
          {isEditing ? (
            <ReviewEditForm
              review={review}
              onSaved={handleSaved}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
              {review.content || "内容不明"}
            </p>
          )}
          {deleteError && (
            <p
              role="alert"
              className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
            >
              {deleteError}
            </p>
          )}
          <div className="flex gap-4 text-sm">
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              <span>👍</span> 役に立つ (0)
            </button>
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
              💬 コメント
            </button>
            {canManage && !isEditing && !isConfirmingDelete && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setIsEditing(true);
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                >
                  ✏️ 編集
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setIsConfirmingDelete(true);
                  }}
                  className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1"
                >
                  🗑️ 削除
                </button>
              </>
            )}
            {canManage && isConfirmingDelete && (
              <div
                role="group"
                aria-label="削除の確認"
                className="flex items-center gap-2"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  このレビューを削除しますか？
                </span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="rounded bg-red-600! px-3 py-1 text-white hover:bg-red-700! disabled:opacity-60"
                >
                  {deleting ? "削除中..." : "削除する"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setIsConfirmingDelete(false)}
                  className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-800"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
