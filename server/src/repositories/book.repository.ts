import { DestroyOptions, FindOptions, Op, Transaction } from 'sequelize';

import Book from '../models/Book';
import Favorite from '../models/Favorite';
import Review from '../models/Review';
import { CreateBookDto, ListBooksQueryDto, UpdateBookDto } from '../modules/book/dto/book.dto';

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
export async function findBooksWithPagination(queryDto: ListBooksQueryDto) {
  const { page, limit, author, publicationYearFrom, publicationYearTo, sort, order } = queryDto;
  const offset = (page - 1) * limit;

  // フィルター条件
  const where: Record<string, unknown> = {};
  // ソート条件
  const orderClause: [string, 'ASC' | 'DESC'][] = [['createdAt', 'DESC']];

  // ソート順はascのみASC、それ以外はDESCとする 
  const sortOrder: 'ASC' | 'DESC' = order === 'asc' ? 'ASC' : 'DESC';

  // 著者名の部分一致検索
  if(author){
    where.author = { [Op.like]: `%${author}%` };
  }

  // 出版年の範囲検索
  // 
  if(publicationYearFrom !== undefined || publicationYearTo !== undefined) {

// where.publicationYear は unknown 扱いになるため、条件オブジェクトを先に組み立ててから代入する
    const publicationYearCondition: Record<symbol, number> = {};

    if(publicationYearFrom !== undefined) {
      publicationYearCondition[Op.gte] = publicationYearFrom;
    }
    if(publicationYearTo !== undefined) {
      publicationYearCondition[Op.lte] = publicationYearTo;
    }
    where.publicationYear = publicationYearCondition;
  }

  // タイトルでソート
  if(sort === 'title') {
    orderClause[0] = ['title', sortOrder];
  }else if(sort === 'publicationYear') {
    orderClause[0] = ['publicationYear', sortOrder];
  } else if(sort === 'createdAt') {
    orderClause[0] = ['createdAt', sortOrder];
  }



  return Book.findAndCountAll({
    limit,
    offset,
    order: orderClause,
    where,
  });
}

/**
 * 主キーで書籍を 1 件取得します。
 *
 * @param bookId - 書籍 ID
 * @returns 書籍。存在しない場合は null
 */
export async function findBookById(bookId: number, options?: FindOptions) {
  return Book.findByPk(bookId, options);
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
export async function countBookReviews(bookId: number, options?: { transaction?: Transaction }) {
  return Review.count({ where: { bookId }, transaction: options?.transaction });
}

/**
 * 指定書籍に紐づくお気に入り件数を返します。
 *
 * @param bookId - 書籍 ID
 * @returns お気に入り件数
 */
export async function countBookFavorites(bookId: number, options?: { transaction?: Transaction }) {
  return Favorite.count({ where: { bookId }, transaction: options?.transaction });
}

/**
 * 取得済みの書籍インスタンスを削除します。
 *
 * @param book - 削除対象の書籍
 */
export async function deleteBook(book: BookInstance, options?: DestroyOptions) {
  await book.destroy(options);
}
