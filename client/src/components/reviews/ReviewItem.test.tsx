import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { Review } from "../../types";
import { ReviewItem } from "./ReviewItem";
import { describe, expect, it } from "vitest";

describe("ReviewItem", () => {
  const sample: Review = {
    id: 1,
    bookId: 42,
    userId: 7,
    rating: 5,
    comment: "Great book",
    createdAt: "2023-02-25T12:00:00.000Z",
  };

  it("renders all fields correctly", () => {
    render(<ReviewItem review={sample} />);

    expect(screen.getByText(/Book ID:/)).toHaveTextContent("Book ID: 42");
    expect(screen.getByText(/User ID:/)).toHaveTextContent("User ID: 7");
    expect(screen.getByText(/Rating:/)).toHaveTextContent("Rating: 5");
    expect(screen.getByText(/Comment:/)).toHaveTextContent(
      "Comment: Great book",
    );
    // time element should include locale string
    expect(screen.getByText(/2023/)).toBeInTheDocument();
  });
});
