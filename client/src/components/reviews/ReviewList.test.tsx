import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Review } from "../../types";
import { ReviewList } from "./ReviewList";

const reviews: Review[] = [
  {
    id: 1,
    bookId: 10,
    userId: 2,
    rating: 3,
    comment: "ok",
    createdAt: "2023-01-01",
  },
  {
    id: 2,
    bookId: 11,
    userId: 3,
    rating: 4,
    comment: "good",
    createdAt: "2023-01-02",
  },
];

describe("ReviewList", () => {
  it("shows empty message when no reviews", () => {
    render(<ReviewList reviews={[]} />);
    expect(screen.getByText(/見つかりません/)).toBeInTheDocument();
  });

  it("renders items when reviews exist", () => {
    render(<ReviewList reviews={reviews} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    // match comment content specifically
    expect(screen.getByText("Comment: ok")).toBeInTheDocument();
    expect(screen.getByText("Comment: good")).toBeInTheDocument();
  });
});
