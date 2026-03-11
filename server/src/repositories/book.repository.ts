import Book from '../models/Book';
import Favorite from '../models/Favorite';
import Review from '../models/Review';
import { CreateBookDto, UpdateBookDto } from '../types/dto';

/**
 * `Book.findByPk` が返す実体型です。
 *
 * repository の更新・削除 API では、
 * 取得済みインスタンスを受け取るためこの型を明示しています。
 */
export type BookInstance = NonNullable<Awaited<ReturnType<typeof Book.findByPk>>>;

/**
 * 書籍一覧をページング付きで取得します。
 *
 * @param page - 1 始まりのページ番号
 * @param limit - 1 ページあたりの件数
 * @returns 総件数と該当ページの書籍一覧
 */
export async function findBooksWithPagination(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return Book.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
}

/**
 * 主キーで書籍を 1 件取得します。
 *
 * @param bookId - 書籍 ID
 * @returns 書籍。存在しない場合は null
 */
export async function findBookById(bookId: number) {
  return Book.findByPk(bookId);
}

/**
 * ISBN で書籍を 1 件取得します。
 *
 * @param isbn - ISBN
 * @returns 書籍。存在しない場合は null
 */
export async function findBookByIsbn(isbn: string) {
  return Book.findOne({ where: { ISBN: isbn } });
}

/**
 * 書籍を新規作成します。
 *
 * @param data - 作成データ
 * @returns 作成済み書籍
 */
export async function createBook(data: CreateBookDto) {
  return Book.create(data);
}

/**
 * 取得済みの書籍インスタンスを更新します。
 *
 * @param book - 更新対象の書籍
 * @param data - 更新データ
 * @returns 更新後の書籍
 */
export async function updateBook(book: BookInstance, data: UpdateBookDto) {
  await book.update(data);
  return book;
}

/**
 * 指定書籍に紐づくレビュー件数を返します。
 *
 * @param bookId - 書籍 ID
 * @returns レビュー件数
 */
export async function countBookReviews(bookId: number) {
  return Review.count({ where: { bookId } });
}

/**
 * 指定書籍に紐づくお気に入り件数を返します。
 *
 * @param bookId - 書籍 ID
 * @returns お気に入り件数
 */
export async function countBookFavorites(bookId: number) {
  return Favorite.count({ where: { bookId } });
}

/**
 * 取得済みの書籍インスタンスを削除します。
 *
 * @param book - 削除対象の書籍
 */
export async function deleteBook(book: BookInstance) {
  await book.destroy();
}
