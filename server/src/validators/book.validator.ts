import { Request } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { CreateBookDto, ListBooksQueryDto, UpdateBookDto } from '../modules/book/dto/book.dto';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * 既存実装の `parseInt(value) || defaultValue` と同じ挙動で数値化します。
 *
 * 0 や NaN はデフォルト値に倒し、負数はそのまま通すことで、
 * リファクタリング前の books API と互換にします。
 *
 * @param rawValue - クエリから受け取った生の値
 * @param defaultValue - フォールバック値
 * @returns 互換挙動で正規化した数値
 */
function parseLegacyPagingValue(
  rawValue: unknown,
  defaultValue: number | undefined
): number | undefined {
  const firstValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  const parsed = parseInt(String(firstValue), 10);
  return parsed || defaultValue;
}

function parseStrictOptionalInteger(
  rawValue: unknown,
  field: string,
  errors: ValidationError[]
): number | undefined {
  const firstValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  if (firstValue === undefined || firstValue === null) {
    return undefined;
  }

  const normalized = String(firstValue).trim();
  if (normalized === '') {
    return undefined;
  }

  if (!/^-?\d+$/.test(normalized)) {
    errors.push({
      field,
      message: `${field}は整数で指定してください。`,
      code: 'INVALID_QUERY_PARAM',
    });
    return undefined;
  }

  return Number(normalized);
}

/**
 * 一覧取得用のクエリを正規化します。
 *
 * validator の責務は「HTTP で受け取った値を、以降の層が扱いやすい DTO へ寄せること」です。
 * ここでは `page` / `limit` の既定値補完と、任意フィルタの未指定判定を行い、
 * repository で不要な条件が生えないようにしています。
 *
 * @param req - Express Request
 * @returns 正規化済みの一覧クエリ
 */
export function validateListBooksQuery(req: Request): ParseResult<ListBooksQueryDto> {
  const page = parseLegacyPagingValue(req.query.page, 1);
  const limit = parseLegacyPagingValue(req.query.limit, 20);

  const rawSort =
    typeof req.query.sort === 'string' ? req.query.sort.trim() || undefined : undefined;
  const rawOrder =
    typeof req.query.order === 'string'
      ? req.query.order.trim().toLowerCase() || undefined
      : undefined;

  const VALID_SORT_VALUES = ['rating', 'title', 'author', 'publicationYear', 'createdAt'] as const;
  const VALID_ORDER_VALUES = ['asc', 'desc'] as const;

  const errors: ValidationError[] = [];
  const publicationYearFrom = parseStrictOptionalInteger(
    req.query.publicationYearFrom,
    'publicationYearFrom',
    errors
  );
  const publicationYearTo = parseStrictOptionalInteger(
    req.query.publicationYearTo,
    'publicationYearTo',
    errors
  );
  const ratingMin = parseStrictOptionalInteger(req.query.ratingMin, 'ratingMin', errors);

  if (rawSort && !VALID_SORT_VALUES.includes(rawSort as (typeof VALID_SORT_VALUES)[number])) {
    errors.push({
      field: 'sort',
      message: `sortに指定できない値です。`,
      code: 'INVALID_SORT',
    });
  }

  if (rawOrder && !VALID_ORDER_VALUES.includes(rawOrder as (typeof VALID_ORDER_VALUES)[number])) {
    errors.push({
      field: 'order',
      message: `orderに指定できない値です。`,
      code: 'INVALID_ORDER',
    });
  }

  if (limit !== undefined && limit > 100) {
    errors.push({
      field: 'limit',
      message: 'limitは100以下で指定してください。',
      code: 'INVALID_LIMIT',
    });
  }

  if (page !== undefined && page <= 0) {
    errors.push({
      field: 'page',
      message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
      code: 'INVALID_PAGE',
    });
  }

  if (limit !== undefined && limit <= 0) {
    errors.push({
      field: 'limit',
      message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
      code: 'INVALID_LIMIT',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      // 一覧 API のページングは既存互換を保つため、未指定時のみ既定値を補います。
      page: page === undefined ? 1 : page,
      limit: limit === undefined ? 20 : limit,
      // 文字列系フィルタはここで trim しておくと、下位層で空白除去を繰り返さずに済みます。
      keyword:
        typeof req.query.keyword === 'string' ? req.query.keyword.trim() || undefined : undefined,
      author:
        typeof req.query.author === 'string' ? req.query.author.trim() || undefined : undefined,
      // 任意条件は未指定のまま `undefined` で渡し、repository 側で「条件なし」を判定します。
      publicationYearFrom,
      publicationYearTo,
      ratingMin,
      sort: rawSort as ListBooksQueryDto['sort'],
      order: rawOrder as ListBooksQueryDto['order'],
    },
  };
}

/**
 * 書籍詳細取得のパスパラメータを検証します。
 *
 * @param req - Express Request
 * @returns 検証済みの bookId、またはエラー配列
 */
export function validateGetBookDetail(req: Request): ParseResult<{ bookId: number }> {
  const bookId = Number(req.params.id);
  if (!Number.isInteger(bookId) || bookId <= 0) {
    return {
      success: false,
      errors: [
        {
          field: 'id',
          message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
          code: 'INVALID_BOOK_ID',
        },
      ],
    };
  }

  return { success: true, data: { bookId } };
}

/**
 * 書籍作成のリクエストボディを検証します。
 *
 * 必須項目は title / author のみで、それ以外は任意項目として扱います。
 *
 * @param req - Express Request
 * @returns 検証済みの作成 DTO、またはエラー配列
 */
export function validateCreateBook(req: Request): ParseResult<CreateBookDto> {
  const { title, author, publicationYear, ISBN, summary } = req.body;
  const errors: ValidationError[] = [];

  const titleStr = typeof title === 'string' ? title : '';
  const authorStr = typeof author === 'string' ? author : '';

  if (!titleStr.trim()) {
    errors.push({ field: 'title', message: ERROR_MESSAGES.REQUIRED_TITLE });
  }

  if (!authorStr.trim()) {
    errors.push({ field: 'author', message: ERROR_MESSAGES.REQUIRED_AUTHOR });
  }

  if (publicationYear !== undefined && !Number.isInteger(publicationYear)) {
    errors.push({
      field: 'publicationYear',
      message: 'publicationYearは整数で指定してください。',
    });
  }

  if (ISBN !== undefined && typeof ISBN !== 'string') {
    errors.push({
      field: 'ISBN',
      message: 'ISBNは文字列で指定してください。',
    });
  }

  if (summary !== undefined && typeof summary !== 'string') {
    errors.push({
      field: 'summary',
      message: 'summaryは文字列で指定してください。',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      // service には空白除去後の値を渡し、以降の層で再判定しなくて済むようにする。
      title: titleStr.trim(),
      author: authorStr.trim(),
      publicationYear,
      ISBN,
      summary,
    },
  };
}

/**
 * 書籍更新のパスパラメータとボディを検証します。
 *
 * 部分更新 API なので、送られてきた項目だけを `data` に残します。
 * これにより service / repository 側では「更新対象のキーだけを受け取る」前提で実装できます。
 *
 * @param req - Express Request
 * @returns 検証済みの bookId と更新データ、またはエラー配列
 */
export function validateUpdateBook(
  req: Request
): ParseResult<{ bookId: number; data: UpdateBookDto }> {
  const bookId = Number(req.params.id);
  const { title, author, publicationYear, ISBN, summary } = req.body;
  const errors: ValidationError[] = [];

  if (!Number.isInteger(bookId) || bookId <= 0) {
    errors.push({
      field: 'id',
      message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
      code: 'INVALID_BOOK_ID',
    });
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    errors.push({ field: 'title', message: ERROR_MESSAGES.INVALID_TITLE_IF_PROVIDED });
  }

  if (author !== undefined && (typeof author !== 'string' || author.trim() === '')) {
    errors.push({ field: 'author', message: ERROR_MESSAGES.INVALID_AUTHOR_IF_PROVIDED });
  }

  if (publicationYear !== undefined && !Number.isInteger(publicationYear)) {
    errors.push({
      field: 'publicationYear',
      message: 'publicationYearは整数で指定してください。',
    });
  }

  if (ISBN !== undefined && typeof ISBN !== 'string') {
    errors.push({
      field: 'ISBN',
      message: 'ISBNは文字列で指定してください。',
    });
  }

  if (summary !== undefined && typeof summary !== 'string') {
    errors.push({
      field: 'summary',
      message: 'summaryは文字列で指定してください。',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      bookId,
      data: {
        // 送られてきた項目だけを残すことで、既存値を意図せず空で上書きしないようにします。
        ...(typeof title === 'string' ? { title: title.trim() } : {}),
        ...(typeof author === 'string' ? { author: author.trim() } : {}),
        ...(publicationYear !== undefined ? { publicationYear } : {}),
        ...(ISBN !== undefined ? { ISBN } : {}),
        ...(summary !== undefined ? { summary } : {}),
      },
    },
  };
}

/**
 * 書籍レビュー一覧取得のパスパラメータとクエリを検証します。
 *
 * @param req - Express Request
 * @returns 検証済みの bookId とページング条件、またはエラー配列
 */
export function validateGetBookReviews(
  req: Request
): ParseResult<{ bookId: number; page: number; limit: number }> {
  const bookId = Number(req.params.bookId);
  const errors: ValidationError[] = [];

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return {
      success: false,
      errors: [
        {
          field: 'bookId',
          message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
          code: 'INVALID_BOOK_ID',
        },
      ],
    };
  }

  const rawPage = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;

  // 互換のため page/limit の数値化自体は legacy ルールを維持しつつ、
  // クエリで明示的に non-positive が渡された場合だけ弾く。
  const rawParsedPage = parseInt(String(rawPage), 10);
  const rawParsedLimit = parseInt(String(rawLimit), 10);
  if (rawPage !== undefined && Number.isInteger(rawParsedPage) && rawParsedPage <= 0) {
    errors.push({
      field: 'page',
      message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
      code: 'INVALID_PAGE',
    });
  }
  if (rawLimit !== undefined && Number.isInteger(rawParsedLimit) && rawParsedLimit <= 0) {
    errors.push({
      field: 'limit',
      message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
      code: 'INVALID_LIMIT',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      bookId,
      page: parseLegacyPagingValue(req.query.page, 1) || 1,
      limit: parseLegacyPagingValue(req.query.limit, 20) || 20,
    },
  };
}

/**
 * 書籍削除のパスパラメータを検証します。
 *
 * @param req - Express Request
 * @returns 検証済みの bookId、またはエラー配列
 */
export function validateDeleteBook(req: Request): ParseResult<{ bookId: number }> {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return {
      success: false,
      errors: [
        {
          field: 'id',
          message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
          code: 'INVALID_BOOK_ID',
        },
      ],
    };
  }

  return { success: true, data: { bookId } };
}
