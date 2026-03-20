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

  it("getReviewById returns existing review", async () => {
    const promise = mockReviewApi.getReviewById(1);
    vi.advanceTimersByTime(500);

    const result = await promise;
    expect(result.data.id).toBe(1);
    expect(result.data.content).toContain("この本は最高でした");
  });

  it("getReviewById throws ApiHttpError when review not found", async () => {
    const promise = mockReviewApi.getReviewById(999);
    vi.advanceTimersByTime(500);

    await expect(promise).rejects.toEqual(
      new ApiHttpError(404, "Review 999 not found"),
    );
  });

  it("getReviews returns filtered reviews by bookId", async () => {
    const promise = mockReviewApi.getReviews(101);
    vi.advanceTimersByTime(500);
    const result = await promise;

    expect(result.data.reviews.every((r) => r.bookId === 101)).toBe(true);
  });
});
