import type { ApiResponse, Book, CreateBookRequest } from "../types";

const mockBooks: Record<number, Book> = {
  1: {
    id: 1,
    title: "Sample Book 1",
    author: "Author 1",
    publicationYear: 2022,
    ISBN: "1234567890",
    summary: "This is a sample book.",
    createdAt: "2022-01-01T00:00:00.000Z",
    updatedAt: "2022-01-01T00:00:00.000Z",
  },
  2: {
    id: 2,
    title: "Sample Book 2",
    author: "Author 2",
    publicationYear: 2022,
    ISBN: "0987654321",
    summary: "This is another sample book.",
    createdAt: "2022-02-01T00:00:00.000Z",
    updatedAt: "2022-02-01T00:00:00.000Z",
  },
  3: {
    id: 3,
    title: "Sample Book 3",
    author: "Author 3",
    publicationYear: 2022,
    ISBN: "1122334455",
    summary: "This is yet another sample book.",
    createdAt: "2022-03-01T00:00:00.000Z",
    updatedAt: "2022-03-01T00:00:00.000Z",
  },
};

// 書籍のAPIのモック
export const mockBookApi = {
  /**
   * IDで書籍を取得するモック関数
   * @param bookId 取得する書籍のID
   * @returns {Promise<ApiResponse<Book>>} 書籍データを含むAPIレスポンス
   */
  async getBookById(bookId: number): Promise<ApiResponse<Book>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500msの遅延をシミュレート

    // mockBooksから該当書籍を取得
    const book = mockBooks[bookId];

    if (!book) {
      throw new Error(`Book ${bookId} not found`);
    }

    return {
      data: book,
    };
  },

  /**
   * 全書籍一覧を取得するモック関数
   * @returns {Promise<ApiResponse<{ books: Book[] }>>} 書籍の配列を含むAPIレスポンス
   */
  async getAllBooks(): Promise<ApiResponse<{ books: Book[] }>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500msの遅延をシミュレート

    const books = Object.values(mockBooks);

    return {
      data: { books },
    };
  },

  /**
   * 書籍を作成するモック関数
   * @param bookData 作成する書籍のデータ
   * @returns {Promise<ApiResponse<Book>>} 作成された書籍データを含むAPIレスポンス
   */
  async createBook(bookData: CreateBookRequest): Promise<ApiResponse<Book>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500msの遅延をシミュレート

    // IDを自動採番（既存の最大IDに1を加える）
    const maxId =
      Object.keys(mockBooks).length > 0
        ? Math.max(...Object.keys(mockBooks).map(Number))
        : 0;
    const newId = maxId + 1;

    // 新しい書籍データを作成
    const newBook: Book = {
      id: newId,
      ...bookData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // mockBooksに新しい書籍を追加
    mockBooks[newId] = newBook;

    return {
      data: newBook,
    };
  },

  /**
   * 書籍を更新するモック関数
   * @param bookId 更新する書籍のID
   * @param updatedData 更新する書籍のデータ（部分的な更新を許可）
   * @returns {Promise<ApiResponse<Book>>} 更新された書籍データを含むAPIレスポンス
   */
  async updateBook(
    bookId: number,
    updatedData: Partial<Book>,
  ): Promise<ApiResponse<Book>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500msの遅延をシミュレート

    // mockBooksから該当書籍を取得
    const existingBook = mockBooks[bookId];

    if (!existingBook) {
      throw new Error(`Book ${bookId} not found`);
    }

    const updatedBook = {
      ...existingBook,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    mockBooks[bookId] = updatedBook;

    return {
      data: updatedBook,
    };
  },
  /**
   * 書籍を削除するモック関数
   * @param bookId 削除する書籍のID
   * @returns {Promise<ApiResponse<null>>} 削除結果を含むAPIレスポンス
   */
  async deleteBook(bookId: number): Promise<ApiResponse<null>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500msの遅延をシミュレート

    // mockBooksから該当書籍を削除
    if (!mockBooks[bookId]) {
      throw new Error(`Book ${bookId} not found`);
    }
    delete mockBooks[bookId];

    return {
      data: null,
    };
  },
};
