import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../api/apiClient";
import { ApiHttpError } from "../../errors/AppError";
import type { Review } from "../../types";
import { ReviewEditForm } from "./ReviewEditForm";

const review: Review = {
  id: 10,
  bookId: 1,
  userId: 1,
  rating: 4,
  content: "面白かった",
  createdAt: "",
};

/** フォームを描画し、親から渡すコールバックを返す */
const renderForm = () => {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <ReviewEditForm review={review} onSaved={onSaved} onCancel={onCancel} />,
  );
  return { onSaved, onCancel };
};

const edit = (value: string) =>
  fireEvent.change(screen.getByLabelText("レビュー本文"), {
    target: { value },
  });
const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "更新" }));

describe("ReviewEditForm", () => {
  afterEach(() => vi.restoreAllMocks());

  it("現在の本文が入力済みで表示され、評価は編集できない", () => {
    renderForm();

    expect(screen.getByLabelText("レビュー本文")).toHaveValue("面白かった");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("更新すると、trim した本文だけを送り（評価は送らない）、onSaved を呼ぶ", async () => {
    const updateReview = vi
      .spyOn(apiClient, "updateReview")
      .mockResolvedValue({ data: { ...review, content: "また読みたい" } });
    const { onSaved } = renderForm();

    edit("  また読みたい  ");
    submit();

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(updateReview).toHaveBeenCalledWith({
      reviewId: 10,
      content: "また読みたい",
    });
  });

  it("本文が変わっていなければ API を呼ばずに閉じる", () => {
    const updateReview = vi.spyOn(apiClient, "updateReview");
    const { onSaved, onCancel } = renderForm();

    edit("  面白かった  "); // trim すると元と同じ
    submit();

    expect(updateReview).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("本文が空・空白だけ・1001文字ならエラーを表示して API を呼ばない", () => {
    const updateReview = vi.spyOn(apiClient, "updateReview");
    renderForm();

    for (const value of ["", "   ", "a".repeat(1001)]) {
      edit(value);
      submit();
      expect(
        screen.getByText("レビュー本文は1〜1000文字で入力してください"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("レビュー本文")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    }
    expect(updateReview).not.toHaveBeenCalled();
  });

  it("API が失敗するとエラーを表示し、入力は残して onSaved は呼ばない", async () => {
    vi.spyOn(apiClient, "updateReview").mockRejectedValue(
      new ApiHttpError(403, "Forbidden"),
    );
    const { onSaved } = renderForm();

    edit("書き換えた");
    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "権限がありません",
    );
    expect(screen.getByLabelText("レビュー本文")).toHaveValue("書き換えた");
    expect(onSaved).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "更新" })).toBeEnabled(),
    );
  });

  it("入力を直すと、検証エラーと API エラーが消える", async () => {
    vi.spyOn(apiClient, "updateReview").mockRejectedValue(
      new ApiHttpError(500, "Internal Server Error"),
    );
    renderForm();

    edit("");
    submit();
    expect(
      screen.getByText("レビュー本文は1〜1000文字で入力してください"),
    ).toBeInTheDocument();

    edit("直した");
    expect(
      screen.queryByText("レビュー本文は1〜1000文字で入力してください"),
    ).not.toBeInTheDocument();

    submit();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    edit("もう一度直した");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("キャンセルで onCancel を呼ぶ", () => {
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
