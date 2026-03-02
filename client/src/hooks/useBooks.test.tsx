import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../api/apiClient";
import { useBooks } from "./useBooks";
import type { Book } from "../types";

vi.mock("../api/apiClient", () => {
  return {
    apiClient: {
      getAllBooks: vi.fn(),
    },
  };
});

function HookTester() {
  const { books, loading, error } = useBooks();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="error">{error ?? "none"}</div>
      <ul>
        {books.map((b) => (
          <li key={b.id}>{b.title}</li>
        ))}
      </ul>
    </div>
  );
}

const sampleBooks: Book[] = [
  {
    id: 1,
    title: "A",
    author: "a",
    publicationYear: 1999,
    ISBN: "",
    summary: "",
    createdAt: "",
    updatedAt: "",
  },
];

describe("useBooks", () => {
  beforeEach(() => {
    (apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it("returns books and clears loading on success", async () => {
    (
      apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: { books: sampleBooks } });

    render(<HookTester />);
    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    // book title should appear
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByTestId("error")).toHaveTextContent("none");
  });

  it("sets error state when API rejects", async () => {
    (
      apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("fail"));

    render(<HookTester />);
    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("error")).toHaveTextContent("fail");
  });

  it("handles invalid response shape", async () => {
    (
      apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: {} });

    render(<HookTester />);
    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
    expect(screen.getByTestId("error")).toHaveTextContent(
      /不正なレスポンス形式/, // error message in hook
    );
  });
});
