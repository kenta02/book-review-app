import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeleteBookConfirm } from "./DeleteBookConfirm";

const renderConfirm = (
  props: Partial<Parameters<typeof DeleteBookConfirm>[0]> = {},
) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <DeleteBookConfirm
      title="吾輩は猫である"
      isConfirming={false}
      deleting={false}
      error={null}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
};

describe("DeleteBookConfirm", () => {
  it("確認中でもエラーでもなければ何も表示しない", () => {
    const { container } = render(
      <DeleteBookConfirm
        title="t"
        isConfirming={false}
        deleting={false}
        error={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("確認中はタイトル入りの確認文と「削除する」「キャンセル」を表示する", () => {
    const { onConfirm, onCancel } = renderConfirm({ isConfirming: true });

    expect(
      screen.getByText(/「吾輩は猫である」を削除しますか？/),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("削除中はボタンを無効にして「削除中...」を表示する（二重実行の防止）", () => {
    renderConfirm({ isConfirming: true, deleting: true });

    expect(screen.getByRole("button", { name: "削除中..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
  });

  it("エラーだけのときはメッセージと「閉じる」を表示する", () => {
    const { onCancel } = renderConfirm({ error: "削除できません" });

    expect(screen.getByRole("alert")).toHaveTextContent("削除できません");
    expect(
      screen.queryByRole("button", { name: "削除する" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
