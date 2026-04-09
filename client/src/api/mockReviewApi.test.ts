/* global AbortController, DOMException */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockReviewApi } from "./mockReviewApi";
import { ApiHttpError } from "../errors/AppError";

describe("mockReviewApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getReviewById が既存レビューを返す", async () => {
    const promise = mockReviewApi.getReviewById(1);
    vi.advanceTimersByTime(500);

    const result = await promise;
    expect(result.data.id).toBe(1);
    expect(result.data.content).toContain("この本は最高でした");
  });

  it("getReviewById がレビュー未登録時に ApiHttpError を投げる", async () => {
    const promise = mockReviewApi.getReviewById(999);
    vi.advanceTimersByTime(500);

    await expect(promise).rejects.toEqual(
      new ApiHttpError(404, "Review 999 not found"),
    );
  });

  it("getReviews が bookId による絞り込みレビューを返す", async () => {
    const promise = mockReviewApi.getReviews(101);
    vi.advanceTimersByTime(500);
    const result = await promise;

    expect(result.data.reviews.every((r) => r.bookId === 101)).toBe(true);
  });

  it("signal が中断されたとき getReviews が中止される", async () => {
    const controller = new AbortController();
    const promise = mockReviewApi.getReviews(undefined, controller.signal);
    vi.advanceTimersByTime(250);
    controller.abort();
    await expect(promise).rejects.toThrow(DOMException);
    await expect(promise).rejects.toHaveProperty("name", "AbortError");
  });

  it("signal が中断されたとき createReview は状態を変更しない", async () => {
    const baselinePromise = mockReviewApi.getReviews();
    vi.advanceTimersByTime(500);
    const baseline = await baselinePromise;

    const controller = new AbortController();
    const createPromise = mockReviewApi.createReview(
      {
        bookId: 120,
        rating: 5,
        content: "途中で中断",
      },
      controller.signal,
    );

    vi.advanceTimersByTime(250);
    controller.abort();

    await expect(createPromise).rejects.toHaveProperty("name", "AbortError");

    const afterPromise = mockReviewApi.getReviews();
    vi.advanceTimersByTime(500);
    const after = await afterPromise;

    expect(after.data.reviews).toHaveLength(baseline.data.reviews.length);
  });

  it("レビューの作成・更新・削除と未登録ケース", async () => {
    const createPromise = mockReviewApi.createReview({
      bookId: 120,
      rating: 5,
      content: "レビュー",
    });
    vi.advanceTimersByTime(500);
    const created = await createPromise;
    expect(created.data.content).toBe("レビュー");

    const updatePromise = mockReviewApi.updateReview({
      reviewId: created.data.id,
      rating: 4,
      content: "更新",
    });
    vi.advanceTimersByTime(500);
    const updated = await updatePromise;
    expect(updated.data.rating).toBe(4);

    const deletePromise = mockReviewApi.deleteReview(created.data.id);
    vi.advanceTimersByTime(500);
    await expect(deletePromise).resolves.toBeDefined();

    const missingUpdate = mockReviewApi.updateReview({
      reviewId: 9999,
      rating: 1,
    });
    vi.advanceTimersByTime(500);
    await expect(missingUpdate).rejects.toEqual(
      new ApiHttpError(404, "Review 9999 not found"),
    );

    const missingDelete = mockReviewApi.deleteReview(9999);
    vi.advanceTimersByTime(500);
    await expect(missingDelete).rejects.toEqual(
      new ApiHttpError(404, "Review 9999 not found"),
    );
  });
});
