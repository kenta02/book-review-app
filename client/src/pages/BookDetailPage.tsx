import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { BookInfoDetail } from "../components/books/BookInfoDetail";
import { ReviewSectionDetail } from "../components/books/ReviewSectionDetail";
import type { Book, Review } from "../types";
import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { useAuth } from "../auth/useAuth";
import { DeleteBookConfirm } from "../components/books/DeleteBookConfirm";
import { useDeleteBook } from "../hooks/useDeleteBook";
import { logger } from "../utils/logger";

export function BookDetailPage() {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 削除の導線は管理者にだけ表示する（表示の出し分けだけで、権限の判定はサーバーが行う）
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // 削除に成功したら、この書籍はもう存在しないのでダッシュボードへ戻る
  const {
    isConfirming,
    deleting,
    error: deleteError,
    requestDelete,
    cancel,
    confirmDelete,
  } = useDeleteBook(Number(bookId), () => navigate("/dashboard"));

  const handleBack = () => {
    navigate(-1);
  };

  /**
   * レビューの投稿・編集・削除後に、書籍情報（平均評価・件数）とレビュー一覧を再取得する。
   * 画面全体を「読み込み中」に戻さない（フォームの状態を保つため）。失敗しても画面は今の表示のまま残す。
   */
  const reloadAfterReviewChange = async () => {
    if (!bookId) return;
    try {
      const [bookRes, reviewsRes] = await Promise.all([
        apiClient.getBookById(Number(bookId)),
        apiClient.getReviews(Number(bookId)),
      ]);
      setBook(bookRes.data.id ? bookRes.data : null);
      setReviews(reviewsRes.data.reviews);
    } catch (err) {
      logger.error("投稿後の再取得に失敗しました。", err);
    }
  };

  useEffect(() => {
    // 書籍がない場合
    if (!bookId) {
      setError("対象の本が見つかりません。");
      return;
    }
    setLoading(true);

    // 書籍情報の取得
    apiClient
      .getBookById(Number(bookId))
      .then((res) => setBook(res.data.id ? res.data : null))
      .catch((err) => {
        logger.error("書籍情報の取得に失敗しました。", err);
        setError("書籍情報の取得に失敗しました。");
      });

    // レビュー情報の取得
    apiClient
      .getReviews(Number(bookId))
      .then((res) => setReviews(res.data.reviews))
      .catch((err) => {
        logger.error("レビュー取得に失敗しました。", err);
        setError("レビューの取得に失敗しました。");
      })
      .finally(() => setLoading(false));
  }, [bookId]);

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* 戻るボタン */}
        <button
          onClick={handleBack}
          className="flex items-center text-purple-600 transition hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
        >
          <span className="mr-2">←</span>
          <span>書籍一覧に戻る</span>
        </button>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          >
            <span aria-hidden="true">✏️</span>
            <span>編集</span>
          </button>
          {isAdmin && !isConfirming && (
            <button
              type="button"
              onClick={requestDelete}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
            >
              <span aria-hidden="true">🗑️</span>
              <span>削除</span>
            </button>
          )}
        </div>
      </div>

      {/* 削除の確認・エラー（管理者のみ） */}
      {isAdmin && (
        <div className="mb-6">
          <DeleteBookConfirm
            title={book?.title ?? ""}
            isConfirming={isConfirming}
            deleting={deleting}
            error={deleteError}
            onConfirm={confirmDelete}
            onCancel={cancel}
          />
        </div>
      )}

      {/* 本の詳細セクション */}
      <BookInfoDetail book={book} />

      {/* レビューセクション */}
      {loading ? (
        <p>レビューを読み込み中...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ReviewSectionDetail
          reviews={reviews}
          bookId={Number(bookId)}
          onReviewChanged={reloadAfterReviewChange}
        />
      )}
    </MainLayout>
  );
}
