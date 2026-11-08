import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Book } from "../../types";
import { BookInfoDetail } from "./BookInfoDetail";

const baseBook: Book = {
  id: 1,
  title: "テスト書籍",
  author: "著者",
  publicationYear: 2020,
  ISBN: "123",
  summary: "概要",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("BookInfoDetail", () => {
  it("API の平均評価とレビュー件数を表示する", () => {
    render(
      <BookInfoDetail
        book={{ ...baseBook, averageRating: 3.5, reviewCount: 8 }}
      />,
    );
    expect(screen.getByText("3.5")).toBeInTheDocument();
    expect(screen.getByText("(8件のレビュー)")).toBeInTheDocument();
    expect(screen.queryByText("(2件のレビュー)")).not.toBeInTheDocument();
  });

  it("未評価の書籍は「評価なし」を表示する", () => {
    render(
      <BookInfoDetail
        book={{ ...baseBook, averageRating: null, reviewCount: 0 }}
      />,
    );
    expect(screen.getByText("評価なし")).toBeInTheDocument();
  });
});
