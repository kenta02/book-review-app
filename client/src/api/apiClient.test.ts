import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiHttpError } from "../errors/AppError";
import { apiClient } from "./apiClient";

const dummyBooks = [
  {
    id: 1,
    title: "Test Book",
    author: "Author",
    publicationYear: 2021,
    ISBN: "0000",
    summary: "Summary",
    createdAt: "2021-01-01T00:00:00.000Z",
    updatedAt: "2021-01-01T00:00:00.000Z",
  },
];

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_USE_MOCK", "false");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = undefined;
  });

  it("getAllBooks: should return books when response is valid data wrapper", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ data: { books: dummyBooks } }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = fetchMock;

    const response = await apiClient.getAllBooks();

    expect(response.data.books).toEqual(dummyBooks);
    expect(fetchMock).toHaveBeenCalledWith("/api/books", undefined);
  });

  it("getAllBooks: should throw ApiHttpError when HTTP status is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "{}",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = fetchMock;

    await expect(apiClient.getAllBooks()).rejects.toEqual(
      new ApiHttpError(404, "Not Found"),
    );
  });

  it("getAllBooks: should throw ApiHttpError when JSON is invalid", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "not json",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = fetchMock;

    await expect(apiClient.getAllBooks()).rejects.toThrow(
      /Invalid JSON response/i,
    );
  });

  it("deleteBook: should call DELETE and resolve on ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "No Content",
      text: async () => "",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = fetchMock;

    await expect(apiClient.deleteBook(123)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/books/123", {
      method: "DELETE",
    });
  });

  it("deleteBook: should throw ApiHttpError when DELETE returns error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "error",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = fetchMock;

    await expect(apiClient.deleteBook(123)).rejects.toEqual(
      new ApiHttpError(500, "Internal Server Error"),
    );
  });
});
