import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { BookInfoDetail } from "../components/books/BookInfoDetail";
import { ReviewSectionDetail } from "../components/books/ReviewSectionDetail";
import type { Book, Review } from "../types";
import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { logger } from "../utils/logger";

export function BookDetailPage() {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate(-1);
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
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
          >
            <span aria-hidden="true">🗑️</span>
            <span>削除</span>
          </button>
        </div>
      </div>

      {/* 本の詳細セクション */}
      <BookInfoDetail book={book} />

      {/* レビューセクション */}
      {loading ? (
        <p>レビューを読み込み中...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ReviewSectionDetail reviews={reviews} />
      )}
    </MainLayout>
  );
}
