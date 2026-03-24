import {
  col,
  DestroyOptions,
  FindOptions,
  fn,
  GroupedCountResultItem,
  Op,
  Order,
  ProjectionAlias,
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
 * `findAndCountAll` の戻り値型（group あり/なしで `count` の型が変わるため、テストやハンドリングで明示的に扱います）
 */
export type FindBooksWithPaginationResult = {
  rows: BookInstance[];
  count: number | GroupedCountResultItem[];
};

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
 * 書籍検索用の WHERE 句を生成します。
 *
 * フィルタ条件をDtoから取り出し、Sequelizeで扱えるオブジェクトに変換します。
 * - author: 部分一致検索
 * - publicationYearFrom/To: 範囲検索
 * - keyword: title/author/summary の横断検索
 *
 * @param queryDto - リクエストで受け取ったクエリパラメータ
 * @returns Sequelize `where` オブジェクト
 */
function createBooksWhereClause(queryDto: ListBooksQueryDto): Record<string | symbol, unknown> {
  const where: Record<string | symbol, unknown> = {};

  // 項目ごとに既存の値をエスケープしてLIKE検索に利用
  const escapedAuthor = queryDto.author ? escapeLikePattern(queryDto.author) : undefined;
  const escapedKeyword = queryDto.keyword ? escapeLikePattern(queryDto.keyword) : undefined;

  // 著者名を部分一致検索（大文字小文字区別は DB 側の照合順序に依存）
  if (escapedAuthor) {
    where.author = { [Op.like]: `%${escapedAuthor}%` };
  }

  // 出版年の範囲検索条件を組み立て
  if (queryDto.publicationYearFrom !== undefined || queryDto.publicationYearTo !== undefined) {
    const publicationYearCondition: Record<string | symbol, number> = {};

    if (queryDto.publicationYearFrom !== undefined) {
      publicationYearCondition[Op.gte] = queryDto.publicationYearFrom;
    }
    if (queryDto.publicationYearTo !== undefined) {
      publicationYearCondition[Op.lte] = queryDto.publicationYearTo;
    }

    where.publicationYear = publicationYearCondition;
  }

  // フリーワード検索（タイトル・著者・要約）
  if (escapedKeyword) {
    where[Op.or] = [
      { title: { [Op.like]: `%${escapedKeyword}%` } },
      { author: { [Op.like]: `%${escapedKeyword}%` } },
      { summary: { [Op.like]: `%${escapedKeyword}%` } },
    ];
  }

  return where;
}

/**
 * ソート順を決定し、ORDER句を構築します。
 *
 * sort 指定がない場合は `createdAt` 降順がデフォルト。
 * rating のときは集計値 `AVG(Reviews.rating)` をソートキーとします。
 */
function createBooksOrderClause(
  queryDto: ListBooksQueryDto,
  sortOrder: 'ASC' | 'DESC',
  avgRatingExpression: ReturnType<typeof fn>
): Order {
  const orderClause: Order = [['createdAt', 'DESC']];

  const sortMap: Record<string, [string | ReturnType<typeof fn>, 'ASC' | 'DESC']> = {
    rating: [avgRatingExpression, sortOrder],
    title: ['title', sortOrder],
    author: ['author', sortOrder],
    publicationYear: ['publicationYear', sortOrder],
    createdAt: ['createdAt', sortOrder],
  };

  if (queryDto.sort && queryDto.sort in sortMap) {
    orderClause[0] = sortMap[queryDto.sort];
  }

  return orderClause;
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
/**
 * ページング付き書籍一覧取得
 *
 * - レビュー集計（averageRating, reviewCount）を追加
 * - 絞り込み条件・ソート条件・ページ情報を統合
 * - ratingMin がある場合は HAVING 句でフィルタ
 */
export async function findBooksWithPagination(
  queryDto: ListBooksQueryDto
): Promise<FindBooksWithPaginationResult> {
  const offset = (queryDto.page - 1) * queryDto.limit;
  const sortOrder: 'ASC' | 'DESC' = queryDto.order === 'asc' ? 'ASC' : 'DESC';

  // WHERE句を生成
  const where = createBooksWhereClause(queryDto);

  // Reviewsを集計対象として結合（個別行は取得しない）
  const include = [{ model: Review, attributes: [] }];
  const avgRatingExpression = fn('AVG', col('Reviews.rating'));
  const reviewCountExpression = fn('COUNT', col('Reviews.id'));

  const attributes: { include: (string | ProjectionAlias)[] } = {
    include: [
      [avgRatingExpression, 'averageRating'] as ProjectionAlias,
      [reviewCountExpression, 'reviewCount'] as ProjectionAlias,
    ],
  };

  const orderClause = createBooksOrderClause(queryDto, sortOrder, avgRatingExpression);

  const baseOptions = {
    attributes,
    distinct: false,
    group: ['Book.id'],
    include,
    limit: queryDto.limit,
    offset,
    order: orderClause,
    where,
    subQuery: false,
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
export async function findBookById(
  bookId: number,
  options?: FindOptions
): Promise<BookInstance | null> {
  return Book.findByPk(bookId, options);
}

/**
 * ISBN で書籍を 1 件取得します。
 *
 * @param isbn - ISBN
 * @returns 書籍。存在しない場合は null
 */
export async function findBookByIsbn(isbn: string): Promise<BookInstance | null> {
  return Book.findOne({ where: { ISBN: isbn } });
}

/**
 * 書籍を新規作成します。
 *
 * @param data - 作成データ
 * @returns 作成済み書籍
 */
export async function createBook(data: CreateBookDto): Promise<BookInstance> {
  return Book.create(data);
}

/**
 * 取得済みの書籍インスタンスを更新します。
 *
 * @param book - 更新対象の書籍
 * @param data - 更新データ
 * @returns 更新後の書籍
 */
export async function updateBook(book: BookInstance, data: UpdateBookDto): Promise<BookInstance> {
  await book.update(data);
  return book;
}

/**
 * 指定書籍に紐づくレビュー件数を返します。
 *
 * @param bookId - 書籍 ID
 * @returns レビュー件数
 */
export async function countBookReviews(
  bookId: number,
  options?: { transaction?: Transaction }
): Promise<number> {
  return Review.count({ where: { bookId }, transaction: options?.transaction });
}

/**
 * 指定書籍に紐づくお気に入り件数を返します。
 *
 * @param bookId - 書籍 ID
 * @returns お気に入り件数
 */
export async function countBookFavorites(
  bookId: number,
  options?: { transaction?: Transaction }
): Promise<number> {
  return Favorite.count({ where: { bookId }, transaction: options?.transaction });
}

/**
 * 取得済みの書籍インスタンスを削除します。
 *
 * @param book - 削除対象の書籍
 */
export async function deleteBook(book: BookInstance, options?: DestroyOptions): Promise<void> {
  await book.destroy(options);
}
