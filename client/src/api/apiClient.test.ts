import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiHttpError } from "../errors/AppError";
import type { Book } from "../types";
import { apiClient } from "./apiClient";
import { mockBookApi } from "./mockBookApi";

const dummyBooks: Book[] = [
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
const firstDummyBook: Book = dummyBooks[0]!;

const setFetchMock = (fetchMock: typeof fetch) => {
  (globalThis as unknown as { fetch?: typeof fetch }).fetch = fetchMock;
};

const clearFetchMock = () => {
  (globalThis as unknown as { fetch?: typeof fetch }).fetch = undefined;
};

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_USE_MOCK", "false");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearFetchMock();
  });

  it("getAllBooks: should return books when response is valid data wrapper", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ data: { books: dummyBooks } }),
    });

    setFetchMock(fetchMock);

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

    setFetchMock(fetchMock);

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

    setFetchMock(fetchMock);

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

    setFetchMock(fetchMock);

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

    setFetchMock(fetchMock);

    await expect(apiClient.deleteBook(123)).rejects.toEqual(
      new ApiHttpError(500, "Internal Server Error"),
    );
  });

  it("getUserById/getReviewById/getBookById should return resource", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ data: { id: 42, username: "hey" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            data: {
              id: 123,
              rating: 4,
              content: "ok",
              bookId: 1,
              userId: 1,
              createdAt: "",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            data: {
              id: 1,
              title: "title",
              author: "author",
              publicationYear: 2020,
              ISBN: "000",
              summary: "s",
              createdAt: "",
              updatedAt: "",
            },
          }),
      });

    setFetchMock(fetchMock);

    const user = await apiClient.getUserById(42);
    expect(user.data.username).toBe("hey");

    const review = await apiClient.getReviewById(123);
    expect(review.data.rating).toBe(4);

    const book = await apiClient.getBookById(1);
    expect(book.data.title).toBe("title");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/users/42", undefined);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/reviews/123", undefined);
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/books/1", undefined);
  });

  it("getReviews (all and specific) should work", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            data: {
              reviews: [
                {
                  id: 1,
                  bookId: 2,
                  userId: 1,
                  rating: 5,
                  content: "ok",
                  createdAt: "",
                },
              ],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 1,
                itemsPerPage: 20,
              },
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            data: {
              reviews: [],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 20,
              },
            },
          }),
      });

    setFetchMock(fetchMock);

    const allReviews = await apiClient.getReviews();
    expect(allReviews.data.reviews.length).toBe(1);

    const filteredReviews = await apiClient.getReviews(2);
    expect(filteredReviews.data.reviews.length).toBe(0);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/reviews", undefined);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/reviews?bookId=2",
      undefined,
    );
  });

  it("searchBooks: should build URL correctly with query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ data: { books: dummyBooks } }),
    });

    setFetchMock(fetchMock);

    const query = {
      page: 2,
      limit: 5,
      keyword: "React",
      author: "Author",
      publicationYearFrom: 2000,
      publicationYearTo: 2025,
      ratingMin: 3,
      sort: "rating" as const,
      order: "desc" as const,
    };

    const response = await apiClient.searchBooks(query);

    expect(response.data.books).toEqual(dummyBooks);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/books?page=2&limit=5&keyword=React&author=Author&publicationYearFrom=2000&publicationYearTo=2025&ratingMin=3&sort=rating&order=desc",
      undefined,
    );
  });

  it("searchBooks: should call /api/books when query is undefined or empty object", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ data: { books: dummyBooks } }),
    });

    setFetchMock(fetchMock);

    const responseUndefined = await apiClient.searchBooks();
    expect(responseUndefined.data.books).toEqual(dummyBooks);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/books", undefined);

    const responseEmpty = await apiClient.searchBooks({});
    expect(responseEmpty.data.books).toEqual(dummyBooks);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/books", undefined);
  });

  it("searchBooks: should include an empty keyword when set to empty string", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ data: { books: dummyBooks } }),
    });

    setFetchMock(fetchMock);

    const response = await apiClient.searchBooks({ keyword: "" });

    expect(response.data.books).toEqual(dummyBooks);
    expect(fetchMock).toHaveBeenCalledWith("/api/books?keyword=", undefined);
  });

  it("create/update review and book endpoints call correct HTTP verb", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: "Created",
        text: async () =>
          JSON.stringify({
            data: {
              id: 5,
              bookId: 1,
              userId: 1,
              rating: 5,
              content: "nice",
              createdAt: "",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            data: {
              id: 5,
              bookId: 1,
              userId: 1,
              rating: 4,
              content: "meh",
              createdAt: "",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: "Created",
        text: async () =>
          JSON.stringify({
            data: {
              id: 10,
              title: "new",
              author: "author",
              publicationYear: 2022,
              ISBN: "123",
              summary: "x",
              createdAt: "",
              updatedAt: "",
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            data: {
              id: 10,
              title: "update",
              author: "author",
              publicationYear: 2022,
              ISBN: "123",
              summary: "x",
              createdAt: "",
              updatedAt: "",
            },
          }),
      });

    setFetchMock(fetchMock);

    const createdReview = await apiClient.createReview({
      bookId: 1,
      rating: 5,
      content: "nice",
    });
    expect(createdReview.data.id).toBe(5);

    const updatedReview = await apiClient.updateReview({
      reviewId: 5,
      rating: 4,
      content: "meh",
    });
    expect(updatedReview.data.rating).toBe(4);

    const createdBook = await apiClient.createBook({
      title: "new",
      author: "author",
      ISBN: "123",
      publicationYear: 2022,
      summary: "x",
    });
    expect(createdBook.data.title).toBe("new");

    const updatedBook = await apiClient.updateBook(10, { title: "update" });
    expect(updatedBook.data.title).toBe("update");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookId: 1, rating: 5, content: "nice" }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/reviews/5", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reviewId: 5, rating: 4, content: "meh" }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "new",
        author: "author",
        ISBN: "123",
        publicationYear: 2022,
        summary: "x",
      }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/books/10", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "update" }),
    });
  });

  it("fetchJson returns unwrapped payload when data field is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ id: 999, name: "no-data" }),
    });

    setFetchMock(fetchMock);

    const book = await apiClient.getBookById(999);
    expect(book.data.id).toBe(999);
    expect((book.data as unknown as { name: string }).name).toBe("no-data");
  });

  it("should use mock API operations when VITE_USE_MOCK=true", async () => {
    vi.stubEnv("VITE_USE_MOCK", "true");

    const getAllBooksSpy = vi
      .spyOn(mockBookApi, "searchBooks")
      .mockResolvedValue({ data: { books: dummyBooks } });
    const createBookSpy = vi
      .spyOn(mockBookApi, "createBook")
      .mockResolvedValue({ data: { ...firstDummyBook, id: 99 } });
    const updateBookSpy = vi
      .spyOn(mockBookApi, "updateBook")
      .mockResolvedValue({ data: { ...firstDummyBook, title: "updated" } });
    const deleteBookSpy = vi
      .spyOn(mockBookApi, "deleteBook")
      .mockResolvedValue({ data: null });

    const allBooks = await apiClient.getAllBooks();
    expect(allBooks.data.books).toEqual(dummyBooks);

    const created = await apiClient.createBook({
      title: "new",
      author: "a",
      ISBN: "000",
      publicationYear: 2024,
      summary: "s",
    });
    expect(created.data.id).toBe(99);

    const updated = await apiClient.updateBook(99, { title: "updated" });
    expect(updated.data.title).toBe("updated");

    await expect(apiClient.deleteBook(99)).resolves.toBeUndefined();

    expect(getAllBooksSpy).toHaveBeenCalled();
    expect(createBookSpy).toHaveBeenCalled();
    expect(updateBookSpy).toHaveBeenCalledWith(99, { title: "updated" });
    expect(deleteBookSpy).toHaveBeenCalledWith(99);

    // restore original env
    vi.stubEnv("VITE_USE_MOCK", "false");
  });
});
