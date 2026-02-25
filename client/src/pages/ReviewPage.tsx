import { useEffect, useState } from "react";
import type { ApiResponse, Review } from "../types";
import { apiClient } from "../api/apiClient";
import { ReviewList } from "../components/reviews/ReviewList";

export function ReviewPage() {
  // レビュー一覧を保持する状態
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    setLoading(true);
    apiClient
      .getReviews()
      .then((response) => {
        setReviews(response.data.reviews);
        setLoading(false);
      })
      .catch((err: { message: string }) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>レビューを読み込み中...</div>;
  }

  if (error) {
    return <div>エラー: {error}</div>;
  }

  return (
    <div>
      <h1>投稿したレビュー</h1>
      <ReviewList reviews={reviews} />
    </div>
  );
}
