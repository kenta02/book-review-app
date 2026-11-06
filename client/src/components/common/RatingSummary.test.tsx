import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RatingSummary } from "./RatingSummary";

const countFilledStars = (container: HTMLElement) =>
  container.querySelectorAll("span.text-yellow-400").length;

describe("RatingSummary", () => {
  it("card: 評価ありのとき平均値・件数・塗りつぶし星を表示する", () => {
    const { container } = render(
      <RatingSummary averageRating={4.2} reviewCount={12} />,
    );
    expect(screen.getByText("4.2（12件のレビュー）")).toBeInTheDocument();
    expect(countFilledStars(container)).toBe(4);
  });

  it("card: 未評価（null / 0件）のとき「評価なし」と灰色の星を表示する", () => {
    const { container } = render(
      <RatingSummary averageRating={null} reviewCount={0} />,
    );
    expect(screen.getByText("評価なし")).toBeInTheDocument();
    expect(countFilledStars(container)).toBe(0);
  });

  it("props が undefined のときも未評価として表示する", () => {
    render(<RatingSummary />);
    expect(screen.getByText("評価なし")).toBeInTheDocument();
  });

  it("averageRating があっても件数 0 なら未評価として扱う", () => {
    render(<RatingSummary averageRating={3} reviewCount={0} />);
    expect(screen.getByText("評価なし")).toBeInTheDocument();
  });

  it("境界値: 1.0 は星1つ、5.0 は星5つ、4.5 は四捨五入で星5つ", () => {
    const one = render(<RatingSummary averageRating={1} reviewCount={1} />);
    expect(countFilledStars(one.container)).toBe(1);
    one.unmount();

    const five = render(<RatingSummary averageRating={5} reviewCount={1} />);
    expect(countFilledStars(five.container)).toBe(5);
    five.unmount();

    const half = render(<RatingSummary averageRating={4.5} reviewCount={1} />);
    expect(countFilledStars(half.container)).toBe(5);
  });

  it("detail: 数値と件数を別々に表示する", () => {
    render(
      <RatingSummary averageRating={5} reviewCount={2} variant="detail" />,
    );
    expect(screen.getByText("5.0")).toBeInTheDocument();
    expect(screen.getByText("(2件のレビュー)")).toBeInTheDocument();
  });

  it("detail: 未評価のとき「評価なし」を表示する", () => {
    render(
      <RatingSummary averageRating={null} reviewCount={0} variant="detail" />,
    );
    expect(screen.getByText("評価なし")).toBeInTheDocument();
  });
});
