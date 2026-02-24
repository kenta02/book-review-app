import type { Review } from "../../types";
import { ReviewItem } from "./ReviewItem";

type Props = {
  reviews: Review[];
};

export function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return <div>レビューが見つかりませんでした。</div>;
  }

  return (
    <ul>
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review}></ReviewItem>
      ))}
    </ul>
  );
}
