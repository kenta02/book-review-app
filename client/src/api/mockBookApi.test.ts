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
