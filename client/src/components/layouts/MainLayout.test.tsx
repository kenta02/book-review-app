import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MainLayout } from "./MainLayout";
import { BrowserRouter } from "react-router-dom";

// simple stub Sidebar since we don't need its full functionality in this test
// but MainLayout already imports real Sidebar so we can render normally.

describe("MainLayout", () => {
  it("renders children and toggles sidebar via menu button", () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>child-content</div>
        </MainLayout>
      </BrowserRouter>,
    );

    // child rendered
    expect(screen.getByText("child-content")).toBeInTheDocument();

    const menuBtn = screen.getByLabelText("メニュー");
    // sidebar initially hidden in mobile transform class
    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toHaveClass("-translate-x-full");

    fireEvent.click(menuBtn);
    expect(sidebar).toHaveClass("translate-x-0");

    // clicking the overlay should close sidebar
    const overlay = screen.getByTestId("sidebar-overlay");
    fireEvent.click(overlay);
    expect(sidebar).toHaveClass("-translate-x-full");
  });
});
