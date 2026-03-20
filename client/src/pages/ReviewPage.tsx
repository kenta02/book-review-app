import { useEffect, useState } from "react";
import type { Review } from "../types";
import { apiClient } from "../api/apiClient";
import { ReviewList } from "../components/reviews/ReviewList";
import { REVIEW_LIST_ERROR_MESSAGES } from "../constants/messages";
import type { ErrorCode } from "../errors/errorCodes";
import { normalizeError } from "../errors/normalizeError";

export function ReviewPage() {
  // レビュー一覧を保持する状態
  const [reviews, setReviews] = useState<Review[]>([]);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const errorMessage = errorCode ? REVIEW_LIST_ERROR_MESSAGES[errorCode] : null;

  useEffect(() => {
    // アンマウント後の setState を防ぐフラグ
    let mounted = true;

    const fetchReviews = async () => {
      setLoading(true);

      try {
        const response = await apiClient.getReviews();
        if (mounted) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        if (mounted) {
          setErrorCode(normalizeError(error).errorCode);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div>レビューを読み込み中...</div>;
  }

  if (errorMessage) {
    return <div>エラー: {errorMessage}</div>;
  }

  return (
    <div>
      <h1>投稿したレビュー</h1>
      <ReviewList reviews={reviews} />
    </div>
  );
}
