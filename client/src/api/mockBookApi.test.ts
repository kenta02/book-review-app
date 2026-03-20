import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockBookApi } from "./mockBookApi";
import { ApiHttpError } from "../errors/AppError";

describe("mockBookApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getBookById returns existing book", async () => {
    const promise = mockBookApi.getBookById(1);
    vi.advanceTimersByTime(500);
    const result = await promise;

    expect(result.data.id).toBe(1);
    expect(result.data.title).toContain("吾輩は猫である");
  });

  it("getBookById throws ApiHttpError when book not found", async () => {
    const promise = mockBookApi.getBookById(9999);
    vi.advanceTimersByTime(500);
    await expect(promise).rejects.toEqual(
      new ApiHttpError(404, "Book 9999 not found"),
    );
  });

  it("getAllBooks returns full list", async () => {
    const promise = mockBookApi.getAllBooks();
    vi.advanceTimersByTime(500);
    const result = await promise;

    expect(result.data.books.length).toBeGreaterThan(0);
  });
});
