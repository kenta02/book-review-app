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
function parseLegacyPagingValue(rawValue: unknown, defaultValue: number): number {
  const firstValue = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  const parsed = parseInt(String(firstValue), 10);
  return parsed || defaultValue;
}

/**
 * 一覧取得用のクエリを正規化します。
 *
 * `page` と `limit` は既存仕様に合わせて `parseInt(...) || default`
 * と同等の変換だけを行います。
 *
 * @param req - Express Request
 * @returns 正規化済みの一覧クエリ
 */
export function validateListBooksQuery(req: Request): ListBooksQueryDto {
  return {
    page: parseLegacyPagingValue(req.query.page, 1),
    limit: parseLegacyPagingValue(req.query.limit, 20),
    keyword: typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined,
    author: typeof req.query.author === 'string' ? req.query.author.trim() : undefined,
    publicationYearFrom: parseLegacyPagingValue(req.query.publicationYearFrom, 1),
    publicationYearTo: parseLegacyPagingValue(req.query.publicationYearTo, 1),
    ratingMin: parseLegacyPagingValue(req.query.ratingMin, 0),
    sort: typeof req.query.sort === 'string' ? req.query.sort.trim() : undefined,
    order: typeof req.query.order === 'string' ? req.query.order.trim() : undefined,
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

  return {
    success: true,
    data: {
      bookId,
      page: parseLegacyPagingValue(req.query.page, 1),
      limit: parseLegacyPagingValue(req.query.limit, 20),
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
