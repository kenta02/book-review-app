import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../api/apiClient";
import { ApiHttpError } from "../../errors/AppError";
import type { Review } from "../../types";
import { ReviewItemDetail } from "./ReviewItemDetail";

const mockUseAuth = vi.fn();
vi.mock("../../auth/useAuth", () => ({ useAuth: () => mockUseAuth() }));

const review: Review = {
  id: 10,
  bookId: 1,
  userId: 1,
  rating: 4,
  content: "面白かった",
  createdAt: "",
};

/** ログインユーザーを差し替えてレビュー1件を描画する（user が null なら未ログイン、role は既定で一般ユーザー） */
const renderItem = (
  userId: number | null,
  target: Review = review,
  onReviewChanged: () => Promise<void> | void = vi.fn(),
  role: "user" | "admin" = "user",
) => {
  mockUseAuth.mockReturnValue({
    user:
      userId === null ? null : { id: userId, username: "u", email: "e", role },
    status: userId === null ? "unauthenticated" : "authenticated",
  });
  render(
    <ReviewItemDetail review={target} onReviewChanged={onReviewChanged} />,
  );
  return onReviewChanged;
};

const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("ReviewItemDetail", () => {
  beforeEach(() => mockUseAuth.mockReset());
  afterEach(() => vi.restoreAllMocks());

  describe("編集・削除の表示", () => {
    it("自分のレビューには「編集」「削除」を表示する", () => {
      renderItem(1);

      expect(screen.getByRole("button", { name: /編集/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("他人のレビューには表示しない（本文は表示する）", () => {
      renderItem(2);

      expect(screen.getByText("面白かった")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /編集/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /削除/ }),
      ).not.toBeInTheDocument();
    });

    it("管理者は他人のレビューにも「編集」「削除」を表示する", () => {
      renderItem(2, review, vi.fn(), "admin");

      expect(screen.getByRole("button", { name: /編集/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("管理者は投稿者が削除済み（userId が null）のレビューにも表示する", () => {
      renderItem(2, { ...review, userId: null }, vi.fn(), "admin");

      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("一般ユーザーは role が user なら他人のレビューに表示しない", () => {
      renderItem(2, review, vi.fn(), "user");

      expect(
        screen.queryByRole("button", { name: /削除/ }),
      ).not.toBeInTheDocument();
    });

    it("未ログインなら表示しない", () => {
      renderItem(null);

      expect(
        screen.queryByRole("button", { name: /編集/ }),
      ).not.toBeInTheDocument();
    });

    it("投稿者が削除済み（userId が null）のレビューは誰のものでもない", () => {
      renderItem(1, { ...review, userId: null });

      expect(
        screen.queryByRole("button", { name: /編集/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("編集", () => {
    it("「編集」で本文の編集フォームに切り替わり、キャンセルで戻る", () => {
      renderItem(1);

      click("✏️ 編集");
      expect(screen.getByLabelText("レビュー本文")).toHaveValue("面白かった");
      // 編集中は編集・削除ボタンを隠す
      expect(
        screen.queryByRole("button", { name: /削除/ }),
      ).not.toBeInTheDocument();

      click("キャンセル");
      expect(screen.queryByLabelText("レビュー本文")).not.toBeInTheDocument();
      expect(screen.getByText("面白かった")).toBeInTheDocument();
    });

    it("更新に成功すると編集モードを閉じ、onReviewChanged を呼ぶ", async () => {
      vi.spyOn(apiClient, "updateReview").mockResolvedValue({
        data: { ...review, content: "また読みたい" },
      });
      const onReviewChanged = renderItem(1);

      click("✏️ 編集");
      fireEvent.change(screen.getByLabelText("レビュー本文"), {
        target: { value: "また読みたい" },
      });
      click("更新");

      await waitFor(() => expect(onReviewChanged).toHaveBeenCalledTimes(1));
      expect(screen.queryByLabelText("レビュー本文")).not.toBeInTheDocument();
    });
  });

  describe("削除", () => {
    it("「削除」を押しただけでは API を呼ばず、確認を表示する。キャンセルで戻る", () => {
      const deleteReview = vi.spyOn(apiClient, "deleteReview");
      renderItem(1);

      click("🗑️ 削除");
      expect(
        screen.getByRole("group", { name: "削除の確認" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("このレビューを削除しますか？"),
      ).toBeInTheDocument();

      click("キャンセル");
      expect(
        screen.queryByRole("group", { name: "削除の確認" }),
      ).not.toBeInTheDocument();
      expect(deleteReview).not.toHaveBeenCalled();
    });

    it("確認して削除すると API を呼び、onReviewChanged を呼ぶ", async () => {
      const deleteReview = vi
        .spyOn(apiClient, "deleteReview")
        .mockResolvedValue(undefined);
      const onReviewChanged = renderItem(1);

      click("🗑️ 削除");
      click("削除する");

      await waitFor(() => expect(onReviewChanged).toHaveBeenCalledTimes(1));
      expect(deleteReview).toHaveBeenCalledWith({ reviewId: 10 });
    });

    it("管理者は他人のレビューを削除できる（そのレビューの ID で API を呼ぶ）", async () => {
      const deleteReview = vi
        .spyOn(apiClient, "deleteReview")
        .mockResolvedValue(undefined);
      const onReviewChanged = renderItem(2, review, vi.fn(), "admin");

      click("🗑️ 削除");
      click("削除する");

      await waitFor(() => expect(onReviewChanged).toHaveBeenCalledTimes(1));
      expect(deleteReview).toHaveBeenCalledWith({ reviewId: 10 });
    });

    it("コメントが付いていて 409 になったら、削除できない理由を表示する", async () => {
      vi.spyOn(apiClient, "deleteReview").mockRejectedValue(
        new ApiHttpError(409, "Conflict"),
      );
      const onReviewChanged = renderItem(1);

      click("🗑️ 削除");
      click("削除する");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "コメントが付いているレビューは削除できません",
      );
      expect(onReviewChanged).not.toHaveBeenCalled();
      // 確認は閉じ、「編集」「削除」が再び押せる
      expect(
        screen.queryByRole("group", { name: "削除の確認" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it("その他の削除エラー（サーバーエラー）は共通の文言を表示する", async () => {
      vi.spyOn(apiClient, "deleteReview").mockRejectedValue(
        new ApiHttpError(500, "Internal Server Error"),
      );
      renderItem(1);

      click("🗑️ 削除");
      click("削除する");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "サーバーでエラーが発生しました",
      );
    });

    it("エラー表示の後に操作をやり直すと、古いエラーが消える", async () => {
      vi.spyOn(apiClient, "deleteReview").mockRejectedValue(
        new ApiHttpError(409, "Conflict"),
      );
      renderItem(1);

      click("🗑️ 削除");
      click("削除する");
      await screen.findByRole("alert");

      click("🗑️ 削除");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
