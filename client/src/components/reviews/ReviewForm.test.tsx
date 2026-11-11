import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../api/apiClient";
import type { AuthStatus } from "../../auth/authContext";
import { ApiHttpError } from "../../errors/AppError";
import { ReviewForm } from "./ReviewForm";

const mockUseAuth = vi.fn();
vi.mock("../../auth/useAuth", () => ({ useAuth: () => mockUseAuth() }));

const review = {
  id: 10,
  bookId: 1,
  userId: 1,
  rating: 4,
  content: "面白かった",
  createdAt: "",
};

/** 認証状態を差し替えてフォームを描画する */
const renderForm = (
  status: AuthStatus,
  onSubmitted: () => Promise<void> | void = vi.fn(),
) => {
  mockUseAuth.mockReturnValue({ status });
  render(
    <MemoryRouter>
      <ReviewForm bookId={1} onSubmitted={onSubmitted} />
    </MemoryRouter>,
  );
  return onSubmitted;
};

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "レビューを投稿" }));

describe("ReviewForm", () => {
  beforeEach(() => mockUseAuth.mockReset());
  afterEach(() => vi.restoreAllMocks());

  describe("認証状態", () => {
    it("未ログインならフォームの代わりにログインへの案内を出す", () => {
      renderForm("unauthenticated");

      expect(
        screen.queryByRole("button", { name: "レビューを投稿" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute(
        "href",
        "/login",
      );
    });

    it("認証状態の確認中は何も表示しない", () => {
      renderForm("loading");

      expect(screen.queryByRole("form")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("ログイン済み", () => {
    it("投稿に成功すると API を呼び、フォームを空に戻して onSubmitted を呼ぶ", async () => {
      const createReview = vi
        .spyOn(apiClient, "createReview")
        .mockResolvedValue({ data: review });
      const onSubmitted = renderForm("authenticated");

      fireEvent.click(screen.getByLabelText("4点"));
      fireEvent.change(screen.getByLabelText("レビュー本文"), {
        target: { value: "  面白かった  " },
      });
      submit();

      await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
      // 本文の前後の空白は除いて送る
      expect(createReview).toHaveBeenCalledWith({
        bookId: 1,
        rating: 4,
        content: "面白かった",
      });
      expect(screen.getByLabelText("レビュー本文")).toHaveValue("");
      expect(screen.getByLabelText("4点")).not.toBeChecked();
    });

    it("入力が不正なら API を呼ばず、項目ごとにエラーを表示する", () => {
      const createReview = vi.spyOn(apiClient, "createReview");
      renderForm("authenticated");

      submit();

      expect(
        screen.getByText("評価を1〜5から選んでください"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("レビュー本文は1〜1000文字で入力してください"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("レビュー本文")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(createReview).not.toHaveBeenCalled();
    });

    it("空白だけの本文は trim 後に空になるのでエラーになる", () => {
      const createReview = vi.spyOn(apiClient, "createReview");
      renderForm("authenticated");

      fireEvent.click(screen.getByLabelText("3点"));
      fireEvent.change(screen.getByLabelText("レビュー本文"), {
        target: { value: "   " },
      });
      submit();

      expect(
        screen.getByText("レビュー本文は1〜1000文字で入力してください"),
      ).toBeInTheDocument();
      expect(createReview).not.toHaveBeenCalled();
    });

    it("本文が 1001 文字ならエラーになる", () => {
      const createReview = vi.spyOn(apiClient, "createReview");
      renderForm("authenticated");

      fireEvent.click(screen.getByLabelText("3点"));
      fireEvent.change(screen.getByLabelText("レビュー本文"), {
        target: { value: "a".repeat(1001) },
      });
      submit();

      expect(
        screen.getByText("レビュー本文は1〜1000文字で入力してください"),
      ).toBeInTheDocument();
      expect(createReview).not.toHaveBeenCalled();
    });

    it("API が失敗するとエラーを表示し、入力は残して onSubmitted は呼ばない", async () => {
      vi.spyOn(apiClient, "createReview").mockRejectedValue(
        new ApiHttpError(500, "Internal Server Error"),
      );
      const onSubmitted = renderForm("authenticated");

      fireEvent.click(screen.getByLabelText("5点"));
      fireEvent.change(screen.getByLabelText("レビュー本文"), {
        target: { value: "また読みたい" },
      });
      submit();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "サーバーでエラーが発生しました",
      );
      expect(screen.getByLabelText("レビュー本文")).toHaveValue("また読みたい");
      expect(onSubmitted).not.toHaveBeenCalled();
      // 送信後はボタンが再び押せる
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "レビューを投稿" }),
        ).toBeEnabled(),
      );
    });

    it("入力を直すと、その項目のエラーとフォーム全体のエラーが消える", async () => {
      vi.spyOn(apiClient, "createReview").mockRejectedValue(
        new ApiHttpError(401, "Unauthorized"),
      );
      renderForm("authenticated");

      // 検証エラー（評価・本文）を出す
      submit();
      expect(
        screen.getByText("評価を1〜5から選んでください"),
      ).toBeInTheDocument();

      // 評価を選ぶと、評価のエラーだけ消える
      fireEvent.click(screen.getByLabelText("2点"));
      expect(
        screen.queryByText("評価を1〜5から選んでください"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("レビュー本文は1〜1000文字で入力してください"),
      ).toBeInTheDocument();

      // API エラー（フォーム全体）を出し、入力を直すと消える
      fireEvent.change(screen.getByLabelText("レビュー本文"), {
        target: { value: "普通" },
      });
      submit();
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText("レビュー本文"), {
        target: { value: "普通でした" },
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
