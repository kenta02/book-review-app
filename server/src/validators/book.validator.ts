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
 * 0 や NaN はデフォルト値に倒し、負数はそのまま通します。
 * 呼び出し元で non-positive の明示入力を先に弾くことで、
 * 既存互換と入力バリデーションを両立します。
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

/**
 * Optional なクエリパラメータをパースして検証します。
 *
 * - 空文字 / undefined / null は `undefined` として扱います。
 * - 数値でない場合は `INVALID_QUERY_PARAM` エラーを `errors` に追加します。
 *
 * @param rawValue - リクエストクエリの生の値
 * @param field - エラー時に返すフィールド名
 * @param errors - 収集先のエラー配列
 * @returns 変換された数値（未指定・空文字の場合は `undefined`）
 */
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
      message: `${field} must be an integer.`,
      code: 'INVALID_QUERY_PARAM',
    });
    return undefined;
  }

  return Number(normalized);
}

const VALID_SORT_VALUES = ['rating', 'title', 'author', 'publicationYear', 'createdAt'] as const;
const VALID_ORDER_VALUES = ['asc', 'desc'] as const;

/**
 * ソート条件（sort/order）の妥当性を検証し、問題があれば `errors` に追加します。
 *
 * @param rawSort - リクエストから受け取った sort 値（未指定時は undefined）
 * @param rawOrder - リクエストから受け取った order 値（未指定時は undefined）
 * @param errors - 収集先のエラー配列
 */
function validateSortAndOrder(
  rawSort: string | undefined,
  rawOrder: string | undefined,
  errors: ValidationError[]
) {
  if (rawSort && !VALID_SORT_VALUES.includes(rawSort as (typeof VALID_SORT_VALUES)[number])) {
    errors.push({
      field: 'sort',
      message: 'Invalid sort value.',
      code: 'INVALID_SORT',
    });
  }

  if (rawOrder && !VALID_ORDER_VALUES.includes(rawOrder as (typeof VALID_ORDER_VALUES)[number])) {
    errors.push({
      field: 'order',
      message: 'Invalid order value.',
      code: 'INVALID_ORDER',
    });
  }
}

/**
 * ページング関連の値（page/limit）を検証し、問題があれば `errors` に追加します。
 *
 * @param page - 正規化済みの page 値（未指定時は undefined）
 * @param limit - 正規化済みの limit 値（未指定時は undefined）
 * @param errors - 収集先のエラー配列
 */
function validatePagingValues(
  page: number | undefined,
  limit: number | undefined,
  errors: ValidationError[]
) {
  if (limit !== undefined && limit > 100) {
    errors.push({
      field: 'limit',
      message: 'limit must be 100 or less.',
      code: 'INVALID_LIMIT',
    });
  }

  if (page !== undefined && page <= 0) {
    errors.push({
      field: 'page',
      message: ERROR_MESSAGES.PAGE_MUST_BE_POSITIVE_INT,
      code: 'INVALID_PAGE',
    });
  }

  if (limit !== undefined && limit <= 0) {
    errors.push({
      field: 'limit',
      message: ERROR_MESSAGES.LIMIT_MUST_BE_POSITIVE_INT,
      code: 'INVALID_LIMIT',
    });
  }
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

  validateSortAndOrder(rawSort, rawOrder, errors);
  validatePagingValues(page, limit, errors);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      // 一覧 API では未指定時だけ既定値を補い、明示的な不正値は上でバリデーションします。
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
      message: 'publicationYear must be an integer.',
    });
  }

  if (ISBN !== undefined && typeof ISBN !== 'string') {
    errors.push({
      field: 'ISBN',
      message: 'ISBN must be a string.',
    });
  }

  if (summary !== undefined && typeof summary !== 'string') {
    errors.push({
      field: 'summary',
      message: 'summary must be a string.',
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
      message: 'publicationYear must be an integer.',
    });
  }

  if (ISBN !== undefined && typeof ISBN !== 'string') {
    errors.push({
      field: 'ISBN',
      message: 'ISBN must be a string.',
    });
  }

  if (summary !== undefined && typeof summary !== 'string') {
    errors.push({
      field: 'summary',
      message: 'summary must be a string.',
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

  // 一覧 API と同様に、未指定や 0/NaN 相当は既定値へ寄せつつ、
  // 明示的な non-positive 整数だけは入力エラーとして返します。
  const rawParsedPage = parseInt(String(rawPage), 10);
  const rawParsedLimit = parseInt(String(rawLimit), 10);
  if (rawPage !== undefined && Number.isInteger(rawParsedPage) && rawParsedPage <= 0) {
    errors.push({
      field: 'page',
      message: ERROR_MESSAGES.PAGE_MUST_BE_POSITIVE_INT,
      code: 'INVALID_PAGE',
    });
  }
  if (rawLimit !== undefined && Number.isInteger(rawParsedLimit) && rawParsedLimit <= 0) {
    errors.push({
      field: 'limit',
      message: ERROR_MESSAGES.LIMIT_MUST_BE_POSITIVE_INT,
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
