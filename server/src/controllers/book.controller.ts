import { Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as bookService from '../services/book.service';
import {
  validateCreateBook,
  validateDeleteBook,
  validateGetBookDetail,
  validateGetBookReviews,
  validateListBooksQuery,
  validateUpdateBook,
} from '../validators/book.validator';
import { logger } from '../utils/logger';

type ErrorResponse = {
  message: string;
  code: string;
  details?: { field: string; message: string }[];
};

/**
 * `ApiError` を API レスポンス形式に変換して返します。
 *
 * @param res - Express Response
 * @param error - service 層などから送出されたアプリケーション例外
 * @returns エラーレスポンス
 */
function sendApiError(res: Response, error: ApiError) {
  const body: ErrorResponse = {
    message: error.message,
    code: error.code,
  };

  if (error.details) {
    body.details = error.details;
  }

  return res.status(error.statusCode).json({ success: false, error: body });
}

/**
 * 書籍一覧を取得します。
 *
 * controller は HTTP の入口として、クエリの正規化結果を service に渡し、
 * 返却されたデータをそのまま API レスポンスに整形します。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns 書籍一覧とページング情報
 */
export async function listBooks(req: Request, res: Response) {

    const query = validateListBooksQuery(req);
    const result = await bookService.listBooks(query.success ? query.data : { page: 1, limit: 20 });

    const parseResult = validateListBooksQuery(req);

  // バリデーション失敗時は400 Bad Requestでエラーコードと詳細を返す。
  if(!parseResult.success) {

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

}

/**
 * 指定 ID の書籍詳細を取得します。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns 書籍詳細
 */
export async function getBookDetail(req: Request, res: Response) {
  try {
    const parseResult = validateGetBookDetail(req);

    if (!parseResult.success) {
      // バリデーション層は詳細を返し、controller が HTTP 用メッセージへ寄せる。
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
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    logger.error('[BOOKS GET DETAIL] unexpected error occurred', error);
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}

/**
 * 書籍を新規作成します。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns 作成済み書籍
 */
export async function createBook(req: Request, res: Response) {
  try {
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
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    logger.error('[BOOKS POST] unexpected error occurred', error);
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}

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
export async function updateBook(req: Request, res: Response) {
  try {
    const parseResult = validateUpdateBook(req);

    if (!parseResult.success) {
      const hasInvalidBookId = parseResult.errors.some((error) => error.code === 'INVALID_BOOK_ID');
      return res.status(400).json({
        success: false,
        error: {
          message: hasInvalidBookId
            ? ERROR_MESSAGES.INVALID_BOOK_ID
            : ERROR_MESSAGES.VALIDATION_FAILED,
          code: hasInvalidBookId ? 'INVALID_BOOK_ID' : 'VALIDATION_ERROR',
          details: parseResult.errors,
        },
      });
    }

    const data = await bookService.updateBook(parseResult.data.bookId, parseResult.data.data);
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    logger.error('[BOOKS PUT] unexpected error occurred', error);
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}

/**
 * 指定書籍に紐づくレビュー一覧を取得します。
 *
 * @param req - Express Request
 * @param res - Express Response
 * @returns レビュー一覧とページング情報
 */
export async function listBookReviews(req: Request, res: Response) {
  try {
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
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    logger.error('[BOOKS REVIEWS GET] unexpected error occurred', error);
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}

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
export async function deleteBook(req: Request, res: Response) {
  try {
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
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    logger.error('[BOOKS DELETE] unexpected error occurred', error);
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}
