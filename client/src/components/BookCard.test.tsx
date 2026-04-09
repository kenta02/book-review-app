import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { BookCard } from "./BookCard";
import { beforeEach, describe, expect, it, vi } from "vitest";

// mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual(
    "react-router-dom",
  )) as typeof import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("BookCard", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  const baseProps = {
    title: "タイトル",
    author: "著者",
    ratingDisplay: "4.2",
    summary: "説明文",
    ISBN: "ABC",
    publicationYear: 2021,
    bookId: 123,
  };

  it("基本フィールドをレンダリングしクリック時に遷移する", () => {
    render(<BookCard {...baseProps} />);

    expect(screen.getAllByText(/タイトル/).length).toBeGreaterThan(0);
    expect(screen.getByText(/著者/)).toBeInTheDocument();
    expect(screen.getByText(/説明文/)).toBeInTheDocument();
    expect(screen.getByText(/2021年/)).toBeInTheDocument();
    expect(screen.getByText(/ISBN: ABC/)).toBeInTheDocument();

    // click anywhere on the card
    fireEvent.click(screen.getByTestId("book-card"));
    expect(mockNavigate).toHaveBeenCalledWith("/books/123");
  });

  it("liked prop が true のときハートを表示し伝播を防ぐ", () => {
    const stopPropagation = vi.fn();
    render(<BookCard {...baseProps} liked />);

    const button = screen.getByRole("button", { name: /いいね/ });
    expect(button).toHaveTextContent("❤️");

    // simulate click and ensure navigate not called because propagation stopped
    fireEvent.click(button, { stopPropagation });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
