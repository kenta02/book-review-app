import type { ApiResponse, Book, CreateBookRequest } from "../types";
import { ApiHttpError } from "../errors/AppError";

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
      throw new ApiHttpError(404, `Book ${bookId} not found`);
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
  async deleteBook(bookId: number): Promise<ApiResponse<null>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500msの遅延をシミュレート

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
