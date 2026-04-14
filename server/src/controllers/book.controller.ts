import { Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import * as bookService from '../services/book.service';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateCreateBook,
  validateDeleteBook,
  validateGetBookDetail,
  validateGetBookReviews,
  validateListBooksQuery,
  validateUpdateBook,
} from '../validators/book.validator';

/**
 * 書籍一覧を取得します。
 *
 * controller は HTTP の入口として、クエリの正規化結果を service に渡し、
 * 返却されたデータを API レスポンスへ整形します。
 * 一覧 API では validator が失敗した時点で処理を止め、service / repository へ進ませません。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns 書籍一覧とページング情報
 */
export const listBooks = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const parseResult = validateListBooksQuery(req);

  // 不正なクエリで下位層に進まないよう、controller で早期 return します。
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        code: 'VALIDATION_ERROR',
        details: parseResult.errors,
      },
    });
  }

  const result = await bookService.listBooks(parseResult.data);
  return res.json({ success: true, data: result });
});

/**
 * 指定 ID の書籍詳細を取得します。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns 書籍詳細
 */
export const getBookDetail = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const parseResult = validateGetBookDetail(req);

    if (!parseResult.success) {
      // validator は入力の失敗理由を返し、controller は HTTP 向けの形式へ整えます。
      const firstErrorCode = parseResult.errors[0]?.code || 'VALIDATION_ERROR';
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: firstErrorCode,
          details: parseResult.errors,
        },
      });
    }

    const data = await bookService.getBookDetail(parseResult.data.bookId);
    return res.json({ success: true, data });
  }
);

/**
 * 書籍を新規作成します。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns 作成済み書籍
 */
export const createBook = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const parseResult = validateCreateBook(req);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        code: 'VALIDATION_ERROR',
        details: parseResult.errors,
      },
    });
  }

  const data = await bookService.createBook(parseResult.data);
  return res.status(201).json({ success: true, data });
});

/**
 * 書籍を部分更新します。
 *
 * バリデーションエラーのうち ID 不正だけは既存 API と合わせて
 * `INVALID_BOOK_ID` を返し、それ以外は通常の `VALIDATION_ERROR` とします。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns 更新後の書籍
 */
export const updateBook = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const parseResult = validateUpdateBook(req);

  if (!parseResult.success) {
    // ID 不正だけは既存 API のエラーコード互換を維持します。
    const hasInvalidBookId = parseResult.errors.some((error) => error.code === 'INVALID_BOOK_ID');
    return res.status(400).json({
      success: false,
      error: {
        message: hasInvalidBookId ? ERROR_MESSAGES.INVALID_BOOK_ID : ERROR_MESSAGES.VALIDATION_FAILED,
        code: hasInvalidBookId ? 'INVALID_BOOK_ID' : 'VALIDATION_ERROR',
        details: parseResult.errors,
      },
    });
  }

  const data = await bookService.updateBook(parseResult.data.bookId, parseResult.data.data);
  return res.json({ success: true, data });
});

/**
 * 指定書籍に紐づくレビュー一覧を取得します。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns レビュー一覧とページング情報
 */
export const listBookReviews = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const parseResult = validateGetBookReviews(req);

    if (!parseResult.success) {
      const firstErrorCode = parseResult.errors[0]?.code || 'VALIDATION_ERROR';
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: firstErrorCode,
          details: parseResult.errors,
        },
      });
    }

    const data = await bookService.listBookReviews(parseResult.data);
    return res.json({ success: true, data });
  }
);

/**
 * 書籍を削除します。
 *
 * 実際の削除可否判定は service 層に委譲し、controller は
 * HTTP ステータスとレスポンス形式の管理に専念します。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns 204 No Content
 */
export const deleteBook = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const parseResult = validateDeleteBook(req);

  if (!parseResult.success) {
    const firstErrorCode = parseResult.errors[0]?.code || 'VALIDATION_ERROR';
    return res.status(400).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INVALID_BOOK_ID,
        code: firstErrorCode,
        details: parseResult.errors,
      },
    });
  }

  await bookService.deleteBook(parseResult.data.bookId);
  return res.sendStatus(204);
});
