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
    content: "ok",
    createdAt: "2023-01-01",
  },
  {
    id: 2,
    bookId: 11,
    userId: 3,
    rating: 4,
    content: "good",
    createdAt: "2023-01-02",
  },
];

describe("ReviewList", () => {
  it("レビューがないとき空メッセージを表示する", () => {
    render(<ReviewList reviews={[]} />);
    expect(screen.getByText(/見つかりません/)).toBeInTheDocument();
  });

  it("レビューがあるとき項目をレンダリングする", () => {
    render(<ReviewList reviews={reviews} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    // match content specifically
    expect(screen.getByText("Content: ok")).toBeInTheDocument();
    expect(screen.getByText("Content: good")).toBeInTheDocument();
  });
});
