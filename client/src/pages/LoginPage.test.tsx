import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { AuthProvider } from "../auth/AuthProvider";
import { getToken } from "../auth/tokenStorage";
import { ApiHttpError } from "../errors/AppError";
import { LoginPage } from "./LoginPage";
import type { AuthUser } from "../types";

const user: AuthUser = {
  id: 1,
  username: "john_doe",
  email: "john@example.com",
  role: "user",
};

/** 実際の AuthProvider を使い、ログイン後に /dashboard へ移動するところまで確認する */
const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<p>dashboard-page</p>} />
          <Route path="/register" element={<p>register-page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

const fill = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText("メールアドレス"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("パスワード"), {
    target: { value: password },
  });
};

describe("LoginPage", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("ログインに成功するとトークンを保存してダッシュボードへ移動する", async () => {
    const login = vi
      .spyOn(apiClient, "login")
      .mockResolvedValue({ data: { user, token: "tok" } });
    renderLogin();

    fill("john@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByText("dashboard-page")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({
      email: "john@example.com",
      password: "password123",
    });
    expect(getToken()).toBe("tok");
  });

  it("入力が不正なら API を呼ばず、項目ごとにエラーを表示する", () => {
    const login = vi.spyOn(apiClient, "login");
    renderLogin();

    fill("abc", "short");
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      screen.getByText("メールアドレスの形式が正しくありません"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("パスワードは8文字以上で入力してください"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(login).not.toHaveBeenCalled();
  });

  it("認証に失敗するとエラーを表示し、トークンは保存しない", async () => {
    vi.spyOn(apiClient, "login").mockRejectedValue(
      new ApiHttpError(401, "Unauthorized"),
    );
    renderLogin();

    fill("john@example.com", "wrong-password");
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールアドレスまたはパスワードが正しくありません",
    );
    expect(getToken()).toBeNull();
    // 送信後はボタンが再び押せる
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "ログイン" })).toBeEnabled(),
    );
  });

  it("入力を直すと、その項目のエラーとフォーム全体のエラーが消える", async () => {
    vi.spyOn(apiClient, "login").mockRejectedValue(
      new ApiHttpError(401, "Unauthorized"),
    );
    renderLogin();

    // 検証エラー（パスワード）を出す
    fill("john@example.com", "short");
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
    expect(
      screen.getByText("パスワードは8文字以上で入力してください"),
    ).toBeInTheDocument();

    // パスワードを直すと、パスワードのエラーだけ消える
    fireEvent.change(screen.getByLabelText("パスワード"), {
      target: { value: "password123" },
    });
    expect(
      screen.queryByText("パスワードは8文字以上で入力してください"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).not.toHaveAttribute(
      "aria-invalid",
    );

    // API エラー（フォーム全体）を出し、入力を直すと消える
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("メールアドレス"), {
      target: { value: "other@example.com" },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("新規登録へのリンクがある", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: "新規登録" })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
