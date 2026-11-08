import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";

// 認証状態とページ遷移をテストから切り替える
const { mockUseAuth, mockNavigate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockNavigate: vi.fn(),
}));
vi.mock("../../auth/useAuth", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual(
    "react-router-dom",
  )) as typeof import("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

/** Header は Link を含むため Router で包んで描画する */
const renderHeader = (props: { onMenuClick?: () => void } = {}) =>
  render(
    <MemoryRouter>
      <Header {...props} />
    </MemoryRouter>,
  );

/** 認証状態を指定する（logout は呼び出しを検証できるよう返す） */
const setAuth = (
  status: "loading" | "authenticated" | "unauthenticated",
  username?: string,
) => {
  const logout = vi.fn();
  mockUseAuth.mockReturnValue({
    status,
    user: username ? { id: 1, username, email: "u@example.com" } : null,
    login: vi.fn(),
    register: vi.fn(),
    logout,
  });
  return logout;
};

// simple in-memory stub for localStorage used in tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// helper to reset localStorage and html class
const resetEnv = () => {
  localStorage.clear();
  document.documentElement.className = "";
};

describe("Header", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    setAuth("unauthenticated");
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    globalThis.localStorage.clear();
    resetEnv();
  });

  it("ブランドとメニューボタンをレンダリングし onMenuClick を呼ぶ", () => {
    const onMenu = vi.fn();
    renderHeader({ onMenuClick: onMenu });

    const menuBtn = screen.getByLabelText("メニュー");
    expect(menuBtn).toBeInTheDocument();

    fireEvent.click(menuBtn);
    expect(onMenu).toHaveBeenCalled();

    // brand text
    expect(screen.getByText(/BookReview/)).toBeInTheDocument();
  });

  it("ダークモードを切り替え状態を保持する", () => {
    renderHeader();
    const darkBtn = screen.getByLabelText("ダークモード切り替え");

    // initial state should be light mode
    expect(darkBtn).toHaveTextContent("🌙");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("dark")).toBe(JSON.stringify(false));

    // click to enable dark
    fireEvent.click(darkBtn);
    expect(darkBtn).toHaveTextContent("☀️");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("dark")).toBe(JSON.stringify(true));

    // click again back to light
    fireEvent.click(darkBtn);
    expect(darkBtn).toHaveTextContent("🌙");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("dark")).toBe(JSON.stringify(false));
  });

  it("localStorage が例外を投げてもクラッシュしない", () => {
    const originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: () => {
          throw new Error("no localStorage");
        },
        setItem: () => {
          throw new Error("no localStorage");
        },
      },
      configurable: true,
    });

    renderHeader();
    expect(screen.getByLabelText("ダークモード切り替え")).toBeInTheDocument();

    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      configurable: true,
    });
  });

  it("未ログインならログイン・新規登録リンクを表示する", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "新規登録" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.queryByText("ログアウト")).not.toBeInTheDocument();
  });

  it("ログイン済みならユーザー名とログアウトを表示し、押すと logout してログイン画面へ", () => {
    const logout = setAuth("authenticated", "john_doe");
    renderHeader();

    expect(screen.getByTestId("header-username")).toHaveTextContent("john_doe");
    expect(
      screen.queryByRole("link", { name: "ログイン" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ログアウト" }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("確認中はログイン関連の表示を出さない（ちらつき防止）", () => {
    setAuth("loading");
    renderHeader();
    expect(screen.queryByText("ログアウト")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "ログイン" }),
    ).not.toBeInTheDocument();
  });
});
