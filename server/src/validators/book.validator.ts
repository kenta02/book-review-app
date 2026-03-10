import { Request } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ParseResult, ValidationError } from './review.validator';

type BookPayload = {
  title: string;
  author: string;
  publicationYear?: number;
  ISBN?: string;
  summary?: string;
};

type UpdateBookPayload = {
  bookId: number;
  title?: string;
  author?: string;
  publicationYear?: number;
  ISBN?: string;
  summary?: string;
};

type BookReviewsQuery = {
  bookId: number;
  page: number;
  limit: number;
};

const PAGINATION_ERROR_MESSAGES = {
  page: 'pageは1以上の整数で指定してください。',
  limit: 'limitは1以上の整数で指定してください。',
} as const;

/**
 * path param / query に配列が来た場合でも先頭値を取り出して扱いやすくする。
 *
 * @param value - Express 由来のパラメータ値
 * @returns 先頭の文字列。値がなければ空文字
 */
function getFirstParamValue(value: string | string[] | undefined): string {
  // Express の params/query は配列になることがあるため、先頭値へ正規化する。
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

/**
 * books 系 API で共通利用する正の整数 ID バリデーションを行う。
 *
 * @param value - 検証対象の文字列
 * @param field - エラー詳細に入れるフィールド名
 * @returns エラー配列。正常時は空配列
 */
function parsePositiveBookId(value: string, field: string): ValidationError[] {
  // books 系 API の id 判定はこの関数に寄せて error code を揃える。
  const bookId = Number(value);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return [
      {
        field,
        message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
        code: 'INVALID_BOOK_ID',
      },
    ];
  }

  return [];
}

/**
 * pagination 用の query 値を検証し、未指定時は既定値を補完する。
 *
 * @param value - query から取得した元の値
 * @param field - page または limit
 * @param defaultValue - 未指定時に使う既定値
 * @returns 正規化結果またはエラー配列
 */
function parsePositivePaginationValue(
  value: string | string[] | undefined,
  field: 'page' | 'limit',
  defaultValue: number
): ParseResult<number> {
  const normalized = getFirstParamValue(value);

  if (normalized === '') {
    return {
      success: true,
      data: defaultValue,
    };
  }

  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return {
      success: false,
      errors: [
        {
          field,
          message: PAGINATION_ERROR_MESSAGES[field],
        },
      ],
    };
  }

  return {
    success: true,
    data: parsed,
  };
}

/**
 * 書籍一覧取得の query を検証し、page/limit を既定値込みで正規化する。
 *
 * @param req - Express Request
 * @returns page と limit を含む ParseResult
 */
export function validateListBooksQuery(req: Request): ParseResult<{ page: number; limit: number }> {
  // 一覧系は page/limit 未指定時に既定値へ補完する。
  const pageResult = parsePositivePaginationValue(req.query.page as string | string[] | undefined, 'page', 1);
  const limitResult = parsePositivePaginationValue(
    req.query.limit as string | string[] | undefined,
    'limit',
    20
  );

  const errors: ValidationError[] = [];
  if (!pageResult.success) {
    errors.push(...pageResult.errors);
  }
  if (!limitResult.success) {
    errors.push(...limitResult.errors);
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const page = pageResult.success ? pageResult.data : 1;
  const limit = limitResult.success ? limitResult.data : 20;

  return {
    success: true,
    data: { page, limit },
  };
}

/**
 * 書籍詳細取得の path param を検証し、bookId を返す。
 *
 * @param req - Express Request
 * @returns bookId を含む ParseResult
 */
export function validateGetBook(req: Request): ParseResult<{ bookId: number }> {
  const id = getFirstParamValue(req.params.id);
  const errors = parsePositiveBookId(id, 'id');
  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      bookId: Number(id),
    },
  };
}

/**
 * 書籍作成 payload を検証する。
 *
 * @param req - Express Request
 * @returns 作成 payload を含む ParseResult
 */
export function validateCreateBook(req: Request): ParseResult<BookPayload> {
  const { title, author, publicationYear, ISBN, summary } = req.body as BookPayload;
  const errors: ValidationError[] = [];

  // create では title/author を必須とし、空文字も不正とみなす。
  if (!title || title.trim() === '') {
    errors.push({ field: 'title', message: ERROR_MESSAGES.REQUIRED_TITLE });
  }
  if (!author || author.trim() === '') {
    errors.push({ field: 'author', message: ERROR_MESSAGES.REQUIRED_AUTHOR });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title,
      author,
      publicationYear,
      ISBN,
      summary,
    },
  };
}

/**
 * 書籍更新リクエストを検証し、部分更新 payload を返す。
 *
 * @param req - Express Request
 * @returns bookId と更新 payload を含む ParseResult
 */
export function validateUpdateBook(req: Request): ParseResult<UpdateBookPayload> {
  const id = getFirstParamValue(req.params.id);
  const idErrors = parsePositiveBookId(id, 'id');
  if (idErrors.length > 0) {
    return { success: false, errors: idErrors };
  }

  const { title, author, publicationYear, ISBN, summary } = req.body as Omit<
    UpdateBookPayload,
    'bookId'
  >;
  const errors: ValidationError[] = [];

  // update は部分更新のため、指定された項目だけ空文字チェックする。
  if (title !== undefined && (!title || title.trim() === '')) {
    errors.push({ field: 'title', message: ERROR_MESSAGES.REQUIRED_TITLE });
  }
  if (author !== undefined && (!author || author.trim() === '')) {
    errors.push({ field: 'author', message: ERROR_MESSAGES.REQUIRED_AUTHOR });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      bookId: Number(id),
      title,
      author,
      publicationYear,
      ISBN,
      summary,
    },
  };
}

/**
 * 書籍レビュー一覧取得の path param と pagination query を検証する。
 *
 * @param req - Express Request
 * @returns bookId, page, limit を含む ParseResult
 */
export function validateListBookReviews(req: Request): ParseResult<BookReviewsQuery> {
  const bookIdParam = getFirstParamValue(req.params.bookId);
  const errors = parsePositiveBookId(bookIdParam, 'bookId');
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // レビュー一覧も books 一覧と同じ既定値でページングする。
  const pageResult = parsePositivePaginationValue(req.query.page as string | string[] | undefined, 'page', 1);
  const limitResult = parsePositivePaginationValue(
    req.query.limit as string | string[] | undefined,
    'limit',
    20
  );

  const paginationErrors: ValidationError[] = [];
  if (!pageResult.success) {
    paginationErrors.push(...pageResult.errors);
  }
  if (!limitResult.success) {
    paginationErrors.push(...limitResult.errors);
  }

  if (paginationErrors.length > 0) {
    return {
      success: false,
      errors: paginationErrors,
    };
  }

  const page = pageResult.success ? pageResult.data : 1;
  const limit = limitResult.success ? limitResult.data : 20;

  return {
    success: true,
    data: {
      bookId: Number(bookIdParam),
      page,
      limit,
    },
  };
}

/**
 * 書籍削除用の path param を検証し、delete 用の bookId を返す。
 *
 * @param req - Express Request
 * @returns bookId を含む ParseResult
 */
export function validateDeleteBook(req: Request): ParseResult<{ bookId: number }> {
  // delete の id 判定は get と完全に同じロジックを再利用する。
  const getBookResult = validateGetBook(req);
  if (!getBookResult.success) {
    return getBookResult;
  }

  return {
    success: true,
    data: {
      bookId: getBookResult.data.bookId,
    },
  };
}
