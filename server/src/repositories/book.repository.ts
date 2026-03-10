import Book from '../models/Book';
import Favorite from '../models/Favorite';
import Review from '../models/Review';

export type BookInstance = NonNullable<Awaited<ReturnType<typeof Book.findByPk>>>;

export type CreateBookRepositoryInput = {
  title: string;
  author: string;
  publicationYear?: number;
  ISBN?: string;
  summary?: string;
};

export type UpdateBookRepositoryInput = Partial<CreateBookRepositoryInput>;

/**
 * 書籍一覧をページ単位で取得する。
 *
 * @param page - 1 始まりのページ番号
 * @param limit - 1 ページあたりの件数
 * @returns count と rows を含む Sequelize の取得結果
 */
export async function findBooksWithPagination(page: number, limit: number) {
  // offset 計算は repository 側で吸収し、呼び出し元は page/limit だけ渡せばよい。
  const offset = (page - 1) * limit;

  return Book.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
}

/**
 * 主キーで書籍を 1 件取得する。
 *
 * @param bookId - 書籍 ID
 * @returns 書籍モデル、存在しない場合は null
 */
export async function findBookById(bookId: number) {
  return Book.findByPk(bookId);
}

/**
 * ISBN で書籍を 1 件取得する。
 *
 * @param isbn - 検索対象の ISBN
 * @returns 書籍モデル、存在しない場合は null
 */
export async function findBookByIsbn(isbn: string) {
  // ISBN は一意性確認でのみ使うため、単純な findOne に留める。
  return Book.findOne({ where: { ISBN: isbn } });
}

/**
 * 書籍を新規作成する。
 *
 * @param data - 作成する書籍データ
 * @returns 作成された書籍モデル
 */
export async function createBook(data: CreateBookRepositoryInput) {
  return Book.create(data);
}

/**
 * 既存の書籍 instance に対して更新を適用する。
 *
 * @param book - 更新対象の書籍 instance
 * @param data - 更新内容
 * @returns 更新後の書籍モデル
 */
export async function updateBook(book: BookInstance, data: UpdateBookRepositoryInput) {
  // 取得済み instance に対して update することで service 側の存在確認結果を再利用する。
  return book.update(data);
}

/**
 * 指定書籍に紐づくレビュー件数を取得する。
 *
 * @param bookId - 書籍 ID
 * @returns レビュー件数
 */
export async function countBookReviews(bookId: number) {
  return Review.count({ where: { bookId } });
}

/**
 * 指定書籍に紐づくお気に入り件数を取得する。
 *
 * @param bookId - 書籍 ID
 * @returns お気に入り件数
 */
export async function countBookFavorites(bookId: number) {
  return Favorite.count({ where: { bookId } });
}

/**
 * 取得済みの書籍 instance を削除する。
 *
 * @param book - 削除対象の書籍 instance
 * @returns Promise<void>
 */
export async function deleteBook(book: BookInstance) {
  // 削除対象は service で存在確認済みの instance を受け取る。
  await book.destroy();
}
