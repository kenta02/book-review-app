import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookCard } from "./BookCard";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { ApiHttpError } from "../errors/AppError";

vi.mock("../api/apiClient", () => ({
  apiClient: { deleteBook: vi.fn() },
}));
const mockDeleteBook = vi.mocked(apiClient.deleteBook);

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
    mockDeleteBook.mockReset();
  });

  const baseProps = {
    title: "タイトル",
    author: "著者",
    averageRating: 4.2,
    reviewCount: 12,
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

  it("API の平均評価・件数を表示し、ハードコード文字列を出さない", () => {
    render(<BookCard {...baseProps} />);
    expect(screen.getByText("4.2（12件のレビュー）")).toBeInTheDocument();
    expect(screen.queryByText(/15 reviews/)).not.toBeInTheDocument();
  });

  it("未評価の書籍は「評価なし」を表示する", () => {
    render(<BookCard {...baseProps} averageRating={null} reviewCount={0} />);
    expect(screen.getByText("評価なし")).toBeInTheDocument();
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

  describe("削除（管理者のみ）", () => {
    /** 「⋮」メニューの「削除」を押して、確認を表示する */
    const startDelete = () =>
      fireEvent.click(screen.getByRole("button", { name: "削除" }));

    it("canDelete でなければ「削除」を表示しない（「編集」は表示のまま）", () => {
      render(<BookCard {...baseProps} />);

      expect(
        screen.queryByRole("button", { name: "削除" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
    });

    it("管理者が確認で「削除する」を押すと削除して onDeleted を呼ぶ", async () => {
      mockDeleteBook.mockResolvedValue(undefined);
      const onDeleted = vi.fn();
      render(<BookCard {...baseProps} canDelete onDeleted={onDeleted} />);

      startDelete();
      // 確認を挟むので、この時点ではまだ削除しない
      expect(mockDeleteBook).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "削除する" }));

      await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
      expect(mockDeleteBook).toHaveBeenCalledWith(123);
      // カードの遷移は発生しない
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("キャンセルすると削除しない", () => {
      const onDeleted = vi.fn();
      render(<BookCard {...baseProps} canDelete onDeleted={onDeleted} />);

      startDelete();
      fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(mockDeleteBook).not.toHaveBeenCalled();
      expect(onDeleted).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("group", { name: "書籍削除の確認" }),
      ).not.toBeInTheDocument();
    });

    it("409 のときは削除できない理由を表示し、onDeleted は呼ばない", async () => {
      mockDeleteBook.mockRejectedValue(new ApiHttpError(409, "conflict"));
      const onDeleted = vi.fn();
      render(<BookCard {...baseProps} canDelete onDeleted={onDeleted} />);

      startDelete();
      fireEvent.click(screen.getByRole("button", { name: "削除する" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "関連データがあるため、この書籍は削除できません",
      );
      expect(onDeleted).not.toHaveBeenCalled();
    });

    it("403 のときは権限がない旨を表示する", async () => {
      mockDeleteBook.mockRejectedValue(new ApiHttpError(403, "forbidden"));
      render(<BookCard {...baseProps} canDelete />);

      startDelete();
      fireEvent.click(screen.getByRole("button", { name: "削除する" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "書籍を削除する権限がありません",
      );
    });

    it("404 のときは書籍が見つからない旨を表示する", async () => {
      mockDeleteBook.mockRejectedValue(new ApiHttpError(404, "not found"));
      render(<BookCard {...baseProps} canDelete />);

      startDelete();
      fireEvent.click(screen.getByRole("button", { name: "削除する" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "書籍が見つかりません",
      );
    });
  });
});
