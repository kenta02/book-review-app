/* global AbortController, DOMException */
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

  it("getAllBooks aborts when signal is aborted", async () => {
    const controller = new AbortController();
    const promise = mockBookApi.getAllBooks(controller.signal);
    controller.abort();
    vi.advanceTimersByTime(500);
    await expect(promise).rejects.toThrow(DOMException);
    await expect(promise).rejects.toHaveProperty("name", "AbortError");
  });

  it("searchBooks filters by keyword, author, and pagination", async () => {
    const first = mockBookApi.searchBooks({ keyword: "猫" });
    vi.advanceTimersByTime(500);
    const firstResult = await first;
    expect(firstResult.data.books.length).toBeGreaterThan(0);
    expect(
      firstResult.data.books.every(
        (b) =>
          b.title.includes("猫") ||
          b.author.includes("猫") ||
          b.summary.includes("猫"),
      ),
    ).toBe(true);

    const author = mockBookApi.searchBooks({ author: "川端" });
    vi.advanceTimersByTime(500);
    const authorResult = await author;
    expect(authorResult.data.books.length).toBeGreaterThan(0);
    expect(
      authorResult.data.books.every((b) => b.author.includes("川端")),
    ).toBe(true);

    const pageLimit = mockBookApi.searchBooks({ page: 1, limit: 2 });
    vi.advanceTimersByTime(500);
    const pageResult = await pageLimit;
    expect(pageResult.data.books.length).toBe(2);
    expect(pageResult.data.pagination.totalItems).toBeGreaterThanOrEqual(2);
  });

  it("searchBooks supports sorting and rating min", async () => {
    const rating = mockBookApi.searchBooks({ ratingMin: 4.4 });
    vi.advanceTimersByTime(500);
    const ratingResult = await rating;
    expect(
      ratingResult.data.books.every(
        (b) => b.averageRating != null && b.averageRating >= 4.4,
      ),
    ).toBe(true);

    const sorted = mockBookApi.searchBooks({
      sort: "publicationYear",
      order: "desc",
    });
    vi.advanceTimersByTime(500);
    const sortedResult = await sorted;
    expect(sortedResult.data.books).toEqual(
      [...sortedResult.data.books].sort(
        (a, b) => b.publicationYear - a.publicationYear,
      ),
    );
  });

  it("createBook, updateBook, deleteBook and missing book cases", async () => {
    const promiseCreate = mockBookApi.createBook({
      title: "新書",
      author: "著者",
      ISBN: "000",
      summary: "テスト",
      publicationYear: 2024,
    });
    vi.advanceTimersByTime(500);
    const created = await promiseCreate;

    expect(created.data.id).toBeGreaterThan(6);
    expect(created.data.title).toBe("新書");

    const promiseUpdate = mockBookApi.updateBook(created.data.id, {
      summary: "更新",
    });
    vi.advanceTimersByTime(500);
    const updated = await promiseUpdate;
    expect(updated.data.summary).toBe("更新");

    const promiseDelete = mockBookApi.deleteBook(created.data.id);
    vi.advanceTimersByTime(500);
    await expect(promiseDelete).resolves.toBeDefined();

    const missingUpdate = mockBookApi.updateBook(9999, { title: "x" });
    vi.advanceTimersByTime(500);
    await expect(missingUpdate).rejects.toEqual(
      new ApiHttpError(404, "Book 9999 not found"),
    );

    const missingDelete = mockBookApi.deleteBook(9999);
    vi.advanceTimersByTime(500);
    await expect(missingDelete).rejects.toEqual(
      new ApiHttpError(404, "Book 9999 not found"),
    );
  });
});
