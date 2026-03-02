import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

// helper to reset localStorage and html class
const resetEnv = () => {
  localStorage.clear();
  document.documentElement.className = "";
};

describe("Header", () => {
  beforeEach(() => {
    resetEnv();
  });

  it("renders brand and menu button and calls onMenuClick", () => {
    const onMenu = vi.fn();
    render(<Header onMenuClick={onMenu} />);

    const menuBtn = screen.getByLabelText("メニュー");
    expect(menuBtn).toBeInTheDocument();

    fireEvent.click(menuBtn);
    expect(onMenu).toHaveBeenCalled();

    // brand text
    expect(screen.getByText(/BookReview/)).toBeInTheDocument();
  });

  it("toggles dark mode and persists state", () => {
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
});
