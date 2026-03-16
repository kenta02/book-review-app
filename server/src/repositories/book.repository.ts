import {
  col,
  DestroyOptions,
  FindOptions,
  fn,
  literal,
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
 * 検索条件の有無に応じて、単純な一覧取得と評価集計付き一覧取得を切り替えます。
 * `sort=rating` または `ratingMin` が指定されたときだけ Review を JOIN し、
 * AVG(rating) を使った ORDER BY / HAVING を組み立てます。
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

  // 評価条件が必要なケースだけ Review を JOIN し、集計クエリへ切り替えます。
  const usesRatingAggregation = queryDto.sort === 'rating' || queryDto.ratingMin !== undefined;

  // レビュー本体は返さず、AVG(rating) の計算だけに使うため attributes は空にしています。
  const include = usesRatingAggregation ? [{ model: Review, attributes: [] }] : [];

  const avgRatingLiteral = literal('AVG(`Reviews`.`rating`)');

  // `AVG(Reviews.rating) AS avgRating` を一覧結果へ追加し、必要ならクライアントから参照できるようにします。
  const avgRatingAttribute: [ReturnType<typeof literal>, string] = [avgRatingLiteral, 'avgRating'];

  const attributes = usesRatingAggregation
    ? {
        include: [avgRatingAttribute],
      }
    : undefined;

  // sort=rating のときだけ集計列で並べ替え、それ以外は通常カラムのソートを使います。
  if (queryDto.sort === 'rating') {
    orderClause[0] = [avgRatingLiteral, sortOrder];
  } else if (queryDto.sort === 'title') {
    orderClause[0] = ['title', sortOrder];
  } else if (queryDto.sort === 'publicationYear') {
    orderClause[0] = ['publicationYear', sortOrder];
  } else if (queryDto.sort === 'createdAt') {
    orderClause[0] = ['createdAt', sortOrder];
  }

  const baseOptions = {
    limit: queryDto.limit,
    offset,
    order: orderClause,
    where,
  };

  // AVG を使う条件では、Book.id 単位の集計と HAVING を明示的に付与します。
  if (usesRatingAggregation) {
    const having =
      queryDto.ratingMin !== undefined
        ? sequelizeWhere(fn('AVG', col('Reviews.rating')), {
            [Op.gte]: queryDto.ratingMin,
          })
        : undefined;

    return Book.findAndCountAll({
      ...baseOptions,
      include,
      attributes,
      // 1冊につき1行へ畳み込むため、Book.id で GROUP BY します。
      group: [`Book.id`],
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
