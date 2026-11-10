import { describe, expect, it } from "vitest";
import { validateReviewForm } from "./validateReviewForm";

describe("validateReviewForm", () => {
  it("正しい入力ならエラーなし", () => {
    expect(validateReviewForm({ rating: 5, content: "良い本でした" })).toEqual(
      {},
    );
  });

  it("評価が未選択・範囲外・小数ならエラー", () => {
    expect(
      validateReviewForm({ rating: null, content: "a" }).rating,
    ).toBeDefined();
    expect(
      validateReviewForm({ rating: 0, content: "a" }).rating,
    ).toBeDefined();
    expect(
      validateReviewForm({ rating: 6, content: "a" }).rating,
    ).toBeDefined();
    expect(
      validateReviewForm({ rating: 3.5, content: "a" }).rating,
    ).toBeDefined();
  });

  it("評価は 1〜5 を許可する（境界値）", () => {
    expect(validateReviewForm({ rating: 1, content: "a" })).toEqual({});
    expect(validateReviewForm({ rating: 5, content: "a" })).toEqual({});
  });

  it("本文は 1〜1000 文字（境界値）", () => {
    expect(
      validateReviewForm({ rating: 3, content: "" }).content,
    ).toBeDefined();
    expect(validateReviewForm({ rating: 3, content: "a" })).toEqual({});
    expect(
      validateReviewForm({ rating: 3, content: "a".repeat(1000) }),
    ).toEqual({});
    expect(
      validateReviewForm({ rating: 3, content: "a".repeat(1001) }).content,
    ).toBeDefined();
  });

  it("trim せず、渡された値の長さで検証する（サーバーと同じ）", () => {
    // 空白だけでも 1 文字以上なので通る。空白の除去は呼び出し側の責務
    expect(validateReviewForm({ rating: 3, content: " " })).toEqual({});
  });

  it("評価と本文が両方不正なら両方のエラーを返す", () => {
    const errors = validateReviewForm({ rating: null, content: "" });
    expect(Object.keys(errors).sort()).toEqual(["content", "rating"]);
  });
});
