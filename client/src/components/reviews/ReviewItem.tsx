import type { Review } from "../../types";

type Props = {
  review: Review;
};

export function ReviewItem({ review }: Props) {
  return (
    <li>
      <p>Book ID: {review.bookId}</p>
      <p>User ID: {review.userId}</p>
      <p>Rating: {review.rating}</p>
      <p>Content: {review.content}</p>
      <p>
        Created At:{" "}
        <time dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleString()}
        </time>
      </p>
    </li>
  );
}
