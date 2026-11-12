import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { AuthProvider } from "../auth/AuthProvider";
import { getToken } from "../auth/tokenStorage";
import { ApiHttpError } from "../errors/AppError";
import { RegisterPage } from "./RegisterPage";
import type { AuthUser } from "../types";

const user: AuthUser = {
  id: 2,
  username: "new_user",
  email: "new@example.com",
  role: "user",
};

/** 実際の AuthProvider を使い、登録後に /dashboard へ移動するところまで確認する */
const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<p>dashboard-page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

const fill = (username: string, email: string, password: string) => {
  fireEvent.change(screen.getByLabelText("ユーザー名"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByLabelText("メールアドレス"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/パスワード/), {
    target: { value: password },
  });
};

describe("RegisterPage", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("登録に成功するとログイン状態になりダッシュボードへ移動する", async () => {
    const register = vi
      .spyOn(apiClient, "register")
      .mockResolvedValue({ data: { user, token: "reg-token" } });
    renderRegister();

    fill("new_user", "new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    expect(await screen.findByText("dashboard-page")).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith({
      username: "new_user",
      email: "new@example.com",
      password: "password123",
    });
    expect(getToken()).toBe("reg-token");
  });

  it("入力が不正なら API を呼ばずエラーを表示する", () => {
    const register = vi.spyOn(apiClient, "register");
    renderRegister();

    fill("a", "bad", "short");
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      screen.getByText("ユーザー名は2〜150文字で入力してください"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("メールアドレスの形式が正しくありません"),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("ユーザー名とメールの前後の空白を除いた値で検証・送信する", async () => {
    const register = vi
      .spyOn(apiClient, "register")
      .mockResolvedValue({ data: { user, token: "reg-token" } });
    renderRegister();

    fill("  new_user  ", " new@example.com ", "password123");
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    expect(await screen.findByText("dashboard-page")).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith({
      username: "new_user",
      email: "new@example.com",
      password: "password123",
    });
  });

  it("入力を直すと、その項目のエラーとフォーム全体のエラーが消える", async () => {
    vi.spyOn(apiClient, "register").mockRejectedValue(
      new ApiHttpError(409, "Conflict"),
    );
    renderRegister();

    // 検証エラー（ユーザー名）を出す
    fill("a", "new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));
    expect(
      screen.getByText("ユーザー名は2〜150文字で入力してください"),
    ).toBeInTheDocument();

    // ユーザー名を直すと、ユーザー名のエラーだけ消える
    fireEvent.change(screen.getByLabelText("ユーザー名"), {
      target: { value: "new_user" },
    });
    expect(
      screen.queryByText("ユーザー名は2〜150文字で入力してください"),
    ).not.toBeInTheDocument();

    // API エラー（フォーム全体）を出し、入力を直すと消える
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("メールアドレス"), {
      target: { value: "other@example.com" },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("メール重複（409）は分かる形で表示し、トークンは保存しない", async () => {
    vi.spyOn(apiClient, "register").mockRejectedValue(
      new ApiHttpError(409, "Conflict"),
    );
    renderRegister();

    fill("new_user", "new@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("既に登録");
    expect(getToken()).toBeNull();
  });
});
