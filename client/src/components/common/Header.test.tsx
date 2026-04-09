import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

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
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    globalThis.localStorage.clear();
    resetEnv();
  });

  it("ブランドとメニューボタンをレンダリングし onMenuClick を呼ぶ", () => {
    const onMenu = vi.fn();
    render(<Header onMenuClick={onMenu} />);

    const menuBtn = screen.getByLabelText("メニュー");
    expect(menuBtn).toBeInTheDocument();

    fireEvent.click(menuBtn);
    expect(onMenu).toHaveBeenCalled();

    // brand text
    expect(screen.getByText(/BookReview/)).toBeInTheDocument();
  });

  it("ダークモードを切り替え状態を保持する", () => {
    render(<Header />);
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

    render(<Header />);
    expect(screen.getByLabelText("ダークモード切り替え")).toBeInTheDocument();

    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      configurable: true,
    });
  });
});
