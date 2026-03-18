import {
  col,
  DestroyOptions,
  FindOptions,
  fn,
  Op,
  Order,
  Transaction,
  where as sequelizeWhere,
} from 'sequelize';

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
 * LIKE クエリに使用する値をエスケープします。
 *
 * これにより、ユーザー入力に `%` や `_`、`\` が含まれていても、それらを文字通りの値として検索できます。
 *
 * @param value - エスケープ対象の文字列
 * @returns エスケープされた文字列
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

/**
 * 書籍一覧をページング付きで取得します。
 *
 * 一覧では常にレビュー集計を付与し、
 * `averageRating` / `reviewCount` をレスポンスに載せられるようにします。
 * `sort=rating` または `ratingMin` が指定されたときは、
 * 同じ集計列を ORDER BY / HAVING にも使います。
 *
 * @param queryDto - 一覧取得クエリ
 * @returns 総件数と該当ページの書籍一覧
 */
export async function findBooksWithPagination(queryDto: ListBooksQueryDto) {
  const offset = (queryDto.page - 1) * queryDto.limit;

  // WHERE 句の基本条件をここに積み上げ、最後に findAndCountAll へ渡します。
  const where: Record<string | symbol, unknown> = {};
  // 並び順は createdAt DESC を既定とし、指定がある場合だけ上書きします。
  const orderClause: Order = [['createdAt', 'DESC']];

  // ソート順はascのみASC、それ以外はDESCとする
  const sortOrder: 'ASC' | 'DESC' = queryDto.order === 'asc' ? 'ASC' : 'DESC';

  const escapedAuthor = queryDto.author ? escapeLikePattern(queryDto.author) : undefined;
  const escapedKeyword = queryDto.keyword ? escapeLikePattern(queryDto.keyword) : undefined;

  // 著者名の部分一致検索
  if (escapedAuthor) {
    where.author = { [Op.like]: `%${escapedAuthor}%` };
  }

  // 出版年の範囲検索
  //
  if (queryDto.publicationYearFrom !== undefined || queryDto.publicationYearTo !== undefined) {
    // where.publicationYear は unknown 扱いになるため、条件オブジェクトを先に組み立ててから代入する
    const publicationYearCondition: Record<string | symbol, number> = {};

    if (queryDto.publicationYearFrom !== undefined) {
      publicationYearCondition[Op.gte] = queryDto.publicationYearFrom;
    }
    if (queryDto.publicationYearTo !== undefined) {
      publicationYearCondition[Op.lte] = queryDto.publicationYearTo;
    }

    where.publicationYear = publicationYearCondition;
  }

  if (escapedKeyword) {
    // keyword は単一フィールドではなく、主要なテキスト列を横断して検索します。
    where[Op.or] = [
      { title: { [Op.like]: `%${escapedKeyword}%` } },
      { author: { [Op.like]: `%${escapedKeyword}%` } },
      { summary: { [Op.like]: `%${escapedKeyword}%` } },
    ];
  }

  // レビュー本体は返さず、集計値だけに使います。
  const include = [{ model: Review, attributes: [] }];

  const avgRatingExpression = fn('AVG', col('Reviews.rating'));
  const reviewCountExpression = fn('COUNT', col('Reviews.id'));

  const averageRatingAttribute: [ReturnType<typeof fn>, string] = [
    avgRatingExpression,
    'averageRating',
  ];
  const reviewCountAttribute: [ReturnType<typeof fn>, string] = [
    reviewCountExpression,
    'reviewCount',
  ];

  const attributes = {
    include: [averageRatingAttribute, reviewCountAttribute],
  };

  // sort=rating のときだけ集計列で並べ替え、それ以外は通常カラムのソートを使います。
  if (queryDto.sort === 'rating') {
    orderClause[0] = [avgRatingExpression, sortOrder];
  } else if (queryDto.sort === 'title') {
    orderClause[0] = ['title', sortOrder];
  } else if (queryDto.sort === 'author') {
    orderClause[0] = ['author', sortOrder];
  } else if (queryDto.sort === 'publicationYear') {
    orderClause[0] = ['publicationYear', sortOrder];
  } else if (queryDto.sort === 'createdAt') {
    orderClause[0] = ['createdAt', sortOrder];
  }

  const baseOptions = {
    attributes,
    distinct: false,
    group: ['Book.id'],
    include,
    limit: queryDto.limit,
    offset,
    order: orderClause,
    where,
  };

  if (queryDto.ratingMin !== undefined) {
    const having = sequelizeWhere(avgRatingExpression, {
      [Op.gte]: queryDto.ratingMin,
    });

    return Book.findAndCountAll({
      ...baseOptions,
      having,
    });
  }

  return Book.findAndCountAll(baseOptions);
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
