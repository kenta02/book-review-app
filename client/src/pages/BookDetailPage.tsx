import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { BookInfoDetail } from "../components/books/BookInfoDetail";
import { ReviewSectionDetail } from "../components/books/ReviewSectionDetail";

export function BookDetailPage() {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();

  const handleBack = () => {
    navigate(-1);
  };

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
      <BookInfoDetail />

      {/* レビューセクション */}
      <ReviewSectionDetail />
    </MainLayout>
  );
}
