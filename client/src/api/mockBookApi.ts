import type {
  ApiResponse,
  Book,
  BookListQuery,
  BookListResponse,
  CreateBookRequest,
} from "../types";
import { ApiHttpError } from "../errors/AppError";
import { waitWithAbort } from "./waitWithAbort";

const mockBooks: Record<number, Book> = {
  1: {
    id: 1,
    title: "吾輩は猫である",
    author: "夏目漱石",
    publicationYear: 1905,
    ISBN: "9784101010014",
    summary: "日本近代文学の古典。猫の目線で人間社会を描く風刺小説。",
    createdAt: "2022-01-01T00:00:00.000Z",
    updatedAt: "2022-01-01T00:00:00.000Z",
    averageRating: 4.2,
    reviewCount: 120,
  },
  2: {
    id: 2,
    title: "雪国",
    author: "川端康成",
    publicationYear: 1947,
    ISBN: "9784101010137",
    summary: "豪雪地帯を舞台に、男女の切ない恋愛を描いた名作。",
    createdAt: "2022-02-01T00:00:00.000Z",
    updatedAt: "2022-02-01T00:00:00.000Z",
    averageRating: 4.5,
    reviewCount: 85,
  },
  3: {
    id: 3,
    title: "羅生門",
    author: "芥川龍之介",
    publicationYear: 1915,
    ISBN: "9784101010151",
    summary: "短編小説。人間のエゴと道徳を問う名作。",
    createdAt: "2022-03-01T00:00:00.000Z",
    updatedAt: "2022-03-01T00:00:00.000Z",
    averageRating: 4.0,
    reviewCount: 60,
  },
  4: {
    id: 4,
    title: "風の歌を聴け",
    author: "村上春樹",
    publicationYear: 1979,
    ISBN: "9784101010212",
    summary: "村上春樹のデビュー作。東京の若者たちの日常と孤独。",
    createdAt: "2022-04-01T00:00:00.000Z",
    updatedAt: "2022-04-01T00:00:00.000Z",
    averageRating: 3.8,
    reviewCount: 150,
  },
  5: {
    id: 5,
    title: "火花",
    author: "又吉直樹",
    publicationYear: 2015,
    ISBN: "9784101010304",
    summary: "漫才師の葛藤と友情を描いた直木賞受賞作。",
    createdAt: "2022-05-01T00:00:00.000Z",
    updatedAt: "2022-05-01T00:00:00.000Z",
    averageRating: 4.3,
    reviewCount: 200,
  },
  6: {
    id: 6,
    title: "コンビニ人間",
    author: "村田沙耶香",
    publicationYear: 2016,
    ISBN: "9784101010373",
    summary: "コンビニで働く女性の日常を通して社会を問う作品。",
    createdAt: "2022-06-01T00:00:00.000Z",
    updatedAt: "2022-06-01T00:00:00.000Z",
    averageRating: 4.1,
    reviewCount: 90,
  },
};

// 書籍のAPIのモック
export const mockBookApi = {
  /**
   * IDで書籍を取得するモック関数
   * @param bookId 取得する書籍のID
   * @returns {Promise<ApiResponse<Book>>} 書籍データを含むAPIレスポンス
   */
  async getBookById(
    bookId: number,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Book>> {
    await waitWithAbort(500, abortSignal); // 500msの遅延をシミュレート

    // mockBooksから該当書籍を取得
    const book = mockBooks[bookId];

    if (!book) {
      throw new ApiHttpError(404, `Book ${bookId} not found`);
    }

    return {
      data: book,
    };
  },

  /**
   * クエリで書籍を検索するモック関数
   *
   */

  async searchBooks(
    query?: BookListQuery,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<BookListResponse>> {
    await waitWithAbort(500, abortSignal); // 500msの遅延をシミュレート

    // クエリに基づいて mockBooks をフィルタリング
    let books = Object.values(mockBooks);

    if (query) {
      if (query.keyword) {
        const keyword = query.keyword.toLowerCase();
        books = books.filter(
          (book) =>
            book.title.toLowerCase().includes(keyword) ||
            book.author.toLowerCase().includes(keyword) ||
            book.summary.toLowerCase().includes(keyword),
        );
      }
      if (query.author) {
        const author = query.author.toLowerCase();
        books = books.filter((book) =>
          book.author.toLowerCase().includes(author),
        );
      }
      if (query.publicationYearFrom != null) {
        books = books.filter(
          (book) => book.publicationYear >= query.publicationYearFrom!,
        );
      }
      if (query.publicationYearTo != null) {
        books = books.filter(
          (book) => book.publicationYear <= query.publicationYearTo!,
        );
      }
      if (query.ratingMin != null) {
        books = books.filter(
          (book) =>
            book.averageRating != null &&
            book.averageRating >= query.ratingMin!,
        );
      }
      if (query.sort) {
        books.sort((a, b) => {
          let compare = 0;
          switch (query.sort) {
            case "title":
              compare = a.title.localeCompare(b.title);
              break;
            case "author":
              compare = a.author.localeCompare(b.author);
              break;
            case "publicationYear":
              compare = a.publicationYear - b.publicationYear;
              break;
            case "rating":
              compare = (a.averageRating ?? 0) - (b.averageRating ?? 0);
              break;
            case "createdAt":
              compare =
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime();
              break;
          }
          return query.order === "desc" ? -compare : compare;
        });
      }
    }

    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.max(1, query?.limit ?? 20);
    const totalItems = books.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const offset = (page - 1) * limit;
    const pagedBooks = books.slice(offset, offset + limit);

    return {
      data: {
        books: pagedBooks,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
        },
      },
    };
  },

  /**
   * 全書籍一覧を取得するモック関数
   * @returns {Promise<ApiResponse<BookListResponse>>} 書籍の配列 + ページネーションを含むAPIレスポンス
   */
  async getAllBooks(
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<BookListResponse>> {
    await waitWithAbort(500, abortSignal); // 500msの遅延をシミュレート

    const books = Object.values(mockBooks);
    const totalItems = books.length;
    const itemsPerPage = totalItems;

    return {
      data: {
        books,
        pagination: {
          currentPage: 1,
          itemsPerPage,
          totalItems,
          totalPages: 1,
        },
      },
    };
  },

  /**
   * 書籍を作成するモック関数
   * @param bookData 作成する書籍のデータ
   * @returns {Promise<ApiResponse<Book>>} 作成された書籍データを含むAPIレスポンス
   */
  async createBook(
    bookData: CreateBookRequest,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Book>> {
    await waitWithAbort(500, abortSignal); // 500msの遅延をシミュレート

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
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Book>> {
    await waitWithAbort(500, abortSignal); // 500msの遅延をシミュレート

    // mockBooksから該当書籍を取得
    const existingBook = mockBooks[bookId];

    if (!existingBook) {
      throw new ApiHttpError(404, `Book ${bookId} not found`);
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
  async deleteBook(
    bookId: number,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<null>> {
    await waitWithAbort(500, abortSignal); // 500msの遅延をシミュレート

    // mockBooksから該当書籍を削除
    if (!mockBooks[bookId]) {
      throw new ApiHttpError(404, `Book ${bookId} not found`);
    }
    delete mockBooks[bookId];

    return {
      data: null,
    };
  },
};
