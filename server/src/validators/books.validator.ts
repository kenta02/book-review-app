import { BooksListQueryDto, BooksListQueryInputDto } from '../types/dto';

/**
 * バリデーションエラーの型定義
 * - field: エラーが発生したフィールド名
 * - message: ユーザー向けのエラーメッセージ（日本語）
 * - code: プログラム処理用のエラーコード
 */
export type ValidationError = {
  field: string;
  message: string;
  code?: string;
};

/**
 * バリデーション結果の型定義
 * 成功時は data に検証済みの DTO を格納
 */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * GET /api/books クエリパラメータをバリデーション
 *
 * @param query - HTTP クエリパラメータ（文字列型）
 * @returns バリデーション結果
 */
export function validateListBooksQuery(
  query: BooksListQueryInputDto
): ParseResult<BooksListQueryDto> {
  const errors: ValidationError[] = [];
  const data: Partial<BooksListQueryDto> = {};

  // ページネーション：page の検証
  if (query.page === undefined) {
    data.page = 1; // デフォルト値
  } else {
    const pageNum = Number(query.page);
    if (!Number.isInteger(pageNum) || pageNum <= 0) {
      errors.push({
        field: 'page',
        message: 'ページ番号は1以上の整数で指定してください',
        code: 'INVALID_PAGE',
      });
    } else {
      data.page = pageNum;
    }
  }

  // ページネーション：limit の検証
  if (query.limit === undefined) {
    data.limit = 20; // デフォルト値
  } else {
    const limitNum = Number(query.limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0 || limitNum > 100) {
      errors.push({
        field: 'limit',
        message: '取得件数は1～100の整数で指定してください',
        code: 'INVALID_LIMIT',
      });
    } else {
      data.limit = limitNum;
    }
  }

  // 検索：キーワード検索（タイトル・著者・概要が対象）
  if (query.keyword !== undefined) {
    const trimmedKeyword = query.keyword.trim();
    if (trimmedKeyword.length === 0 || trimmedKeyword.length > 255) {
      errors.push({
        field: 'keyword',
        message: 'キーワードは1～255文字で指定してください',
        code: 'INVALID_KEYWORD',
      });
    } else {
      data.keyword = trimmedKeyword;
    }
  }

  // フィルタ：著者名（部分一致）
  if (query.author !== undefined) {
    const trimmedAuthor = query.author.trim();
    if (trimmedAuthor.length === 0 || trimmedAuthor.length > 255) {
      errors.push({
        field: 'author',
        message: '著者名は1～255文字で指定してください',
        code: 'INVALID_AUTHOR',
      });
    } else {
      data.author = trimmedAuthor;
    }
  }

  // フィルタ：出版年（開始年）
  if (query.publicationYearFrom !== undefined) {
    const yearFromNum = Number(query.publicationYearFrom);
    if (
      isNaN(yearFromNum) ||
      !Number.isInteger(yearFromNum) ||
      yearFromNum < 1800 ||
      yearFromNum > 2100
    ) {
      errors.push({
        field: 'publicationYearFrom',
        message: '出版年（開始）は1800～2100の整数で指定してください',
        code: 'INVALID_PUBLICATION_YEAR_FROM',
      });
    } else {
      data.publicationYearFrom = yearFromNum;
    }
  }

  // フィルタ：出版年（終了年）
  if (query.publicationYearTo !== undefined) {
    const yearToNum = Number(query.publicationYearTo);
    if (isNaN(yearToNum) || !Number.isInteger(yearToNum) || yearToNum < 1800 || yearToNum > 2100) {
      errors.push({
        field: 'publicationYearTo',
        message: '出版年（終了）は1800～2100の整数で指定してください',
        code: 'INVALID_PUBLICATION_YEAR_TO',
      });
    } else {
      data.publicationYearTo = yearToNum;
    }
  }

  // フィルタ：出版年の範囲チェック（開始年 <= 終了年）
  if (
    data.publicationYearFrom !== undefined &&
    data.publicationYearTo !== undefined &&
    data.publicationYearFrom > data.publicationYearTo
  ) {
    errors.push({
      field: 'publicationYearRange',
      message: '出版年（開始）は出版年（終了）以下である必要があります',
      code: 'INVALID_PUBLICATION_YEAR_RANGE',
    });
  }

  // フィルタ：評価の最小値
  if (query.ratingMin !== undefined) {
    const ratingMinNum = Number(query.ratingMin);
    if (
      isNaN(ratingMinNum) ||
      !Number.isInteger(ratingMinNum) ||
      ratingMinNum < 1 ||
      ratingMinNum > 5
    ) {
      errors.push({
        field: 'ratingMin',
        message: '最小評価は1～5の整数で指定してください',
        code: 'INVALID_RATING_MIN',
      });
    } else {
      data.ratingMin = ratingMinNum;
    }
  }

  // ソート：対象フィールド
  if (query.sort !== undefined) {
    const validSortFields = ['title', 'author', 'publicationYear', 'rating', 'createdAt'];
    if (!validSortFields.includes(query.sort)) {
      errors.push({
        field: 'sort',
        message: `ソート対象は以下から選択してください: ${validSortFields.join(', ')}`,
        code: 'INVALID_SORT_FIELD',
      });
    } else {
      data.sort = query.sort;
    }
  }

  // ソート：昇順・降順
  if (query.order !== undefined) {
    if (query.order !== 'asc' && query.order !== 'desc') {
      errors.push({
        field: 'order',
        message: 'ソート順は「asc」または「desc」で指定してください',
        code: 'INVALID_ORDER',
      });
    } else {
      data.order = query.order;
    }
  }

  // エラーがあれば返却
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // DTO を返却
  return { success: true, data: data as BooksListQueryDto };
}
