import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { BookInfoDetail } from "../components/books/BookInfoDetail";
import { ReviewSectionDetail } from "../components/books/ReviewSectionDetail";
import type { Book, Review } from "../types";
import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

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
        console.error("書籍情報の取得に失敗しました。", err);
        setError("書籍情報の取得に失敗しました。");
      });

    // レビュー情報の取得
    apiClient
      .getReviews(Number(bookId))
      .then((res) => setReviews(res.data.reviews))
      .catch((err) => {
        console.error("レビュー取得に失敗しました。", err);
        setError("レビューの取得に失敗しました。");
      })
      .finally(() => setLoading(false));
  }, [bookId]);

  return (
    <MainLayout>
      {/* 戻るボタン */}
      <button
        onClick={handleBack}
        className="mb-6 flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
      >
        <span className="mr-2">←</span>
        <span>戻る</span>
      </button>

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
