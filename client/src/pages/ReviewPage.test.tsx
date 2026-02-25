import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { ReviewPage } from "./ReviewPage";

vi.mock("../api/apiClient", () => {
  return {
    apiClient: {
      getReviews: vi.fn(),
    },
  };
});

const mockReviews = [
  {
    id: 1,
    bookId: 1,
    userId: 1,
    rating: 5,
    content: "a",
    createdAt: "2023-01-01",
  },
];

describe("ReviewPage", () => {
  beforeEach(() => {
    (apiClient.getReviews as unknown as vi.Mock).mockReset();
  });

  it("renders loading then list", async () => {
    (apiClient.getReviews as unknown as vi.Mock).mockResolvedValue({
      data: {
        reviews: mockReviews,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 20,
        },
      },
    });
    render(<ReviewPage />);
    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/投稿したレビュー/)).toBeInTheDocument(),
    );
    expect(screen.getByText("Content: a")).toBeInTheDocument();
  });

  it("shows empty message when api returns []", async () => {
    (apiClient.getReviews as unknown as vi.Mock).mockResolvedValue({
      data: {
        reviews: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 20,
        },
      },
    });
    render(<ReviewPage />);
    await waitFor(() =>
      expect(screen.getByText(/見つかりません/)).toBeInTheDocument(),
    );
  });

  it("shows error on failure", async () => {
    (apiClient.getReviews as unknown as vi.Mock).mockRejectedValue(
      new Error("fail"),
    );
    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByText(/エラー/)).toBeInTheDocument());
  });
});
