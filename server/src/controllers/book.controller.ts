import { Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as bookService from '../services/book.service';
import {
  validateListBooksQuery,
  validateGetBook,
  validateCreateBook,
  validateUpdateBook,
  validateListBookReviews,
  validateDeleteBook,
} from '../validators/book.validator';

/**
 * 想定外エラーを共通の 500 レスポンスへ変換する。
 *
 * @param res - Express の Response
 * @param message - サーバーログに出す補助メッセージ
 * @param error - 捕捉した例外
 * @returns 500 レスポンス
 */
function sendInternalServerError(res: Response, message: string, error: unknown) {
  // 想定外エラーは controller で共通の 500 レスポンスへ正規化する。
  console.error(message, error);
  return res.status(500).json({
    success: false,
    error: {
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}

/**
 * service から送出された ApiError を HTTP レスポンスへ変換する。
 *
 * @param res - Express の Response
 * @param error - 業務エラーを表す ApiError
 * @returns ApiError の statusCode と code を保持したレスポンス
 */
function sendApiError(res: Response, error: ApiError) {
  // service から上がってきた業務エラーは status/code を保って返す。
  return res.status(error.statusCode).json({
    success: false,
    error: { message: error.message, code: error.code },
  });
}

/**
 * 書籍一覧を取得し、ページング情報付きで返す。
 *
 * @param req - page, limit を含む Request
 * @param res - Express の Response
 * @returns 書籍一覧レスポンス
 */
export async function listBooks(req: Request, res: Response) {
  try {
    // query の正規化は validator に集約し、controller は HTTP 変換だけを見る。
    const parseResult = validateListBooksQuery(req);
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

    const { page, limit } = parseResult.data;
    const offset = (page - 1) * limit;
    const data = await bookService.listBooks({ page, limit });

    console.info(`Fetching books - page: ${page}, limit: ${limit}, offset: ${offset}`);
    console.info(`Found ${data.pagination.totalItems} books in total`);

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, 'Error fetching books:', error);
  }
}

/**
 * 指定 ID の書籍詳細を取得して返す。
 *
 * @param req - path param に id を含む Request
 * @param res - Express の Response
 * @returns 書籍詳細レスポンス
 */
export async function getBook(req: Request, res: Response) {
  try {
    // id が不正な場合は service に到達させず 400 を返す。
    const parseResult = validateGetBook(req);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: parseResult.errors,
        },
      });
    }

    const bookInfo = await bookService.getBookById(parseResult.data.bookId);
    return res.json({ success: true, data: bookInfo });
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, 'Error fetching book:', error);
  }
}

/**
 * 書籍を新規作成して返す。
 *
 * @param req - 書籍作成 payload を含む Request
 * @param res - Express の Response
 * @returns 作成結果レスポンス
 */
export async function createBook(req: Request, res: Response) {
  try {
    console.debug('Received new book data:', req.body);

    // 必須項目の検証失敗は HTTP 400 に畳み込む。
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

    const newBook = await bookService.createBook(parseResult.data);
    return res.status(201).json({ success: true, data: newBook });
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, 'Error creating new book:', error);
  }
}

/**
 * 指定 ID の書籍を部分更新して返す。
 *
 * @param req - path param の id と更新 payload を含む Request
 * @param res - Express の Response
 * @returns 更新結果レスポンス
 */
export async function updateBook(req: Request, res: Response) {
  try {
    console.debug('Received update data for bookId:', req.params.id, req.body);

    // update は id エラーと payload エラーでメッセージを切り分ける。
    const parseResult = validateUpdateBook(req);
    if (!parseResult.success) {
      const firstErrorCode = parseResult.errors?.[0]?.code;

      return res.status(400).json({
        success: false,
        error: {
          message:
            firstErrorCode === 'INVALID_BOOK_ID'
              ? ERROR_MESSAGES.INVALID_BOOK_ID
              : ERROR_MESSAGES.VALIDATION_FAILED,
          code: firstErrorCode || 'VALIDATION_ERROR',
          details: parseResult.errors,
        },
      });
    }

    const updatedBook = await bookService.updateBook(parseResult.data);
    return res.json({ success: true, data: updatedBook });
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, 'Error updating book:', error);
  }
}

/**
 * 指定書籍に紐づくレビュー一覧を取得して返す。
 *
 * @param req - path param の bookId と pagination query を含む Request
 * @param res - Express の Response
 * @returns レビュー一覧レスポンス
 */
export async function listBookReviews(req: Request, res: Response) {
  try {
    // bookId と pagination を正規化したうえで service に委譲する。
    const parseResult = validateListBookReviews(req);
    if (!parseResult.success) {
      const firstErrorCode = parseResult.errors?.[0]?.code;

      return res.status(400).json({
        success: false,
        error: {
          message:
            firstErrorCode === 'INVALID_BOOK_ID'
              ? ERROR_MESSAGES.INVALID_BOOK_ID
              : ERROR_MESSAGES.VALIDATION_FAILED,
          code: firstErrorCode || 'VALIDATION_ERROR',
          details: parseResult.errors,
        },
      });
    }

    const result = await bookService.listBookReviews(parseResult.data);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, 'Error fetching reviews for book:', error);
  }
}

/**
 * 指定 ID の書籍を削除する。
 *
 * @param req - path param に id を含む Request
 * @param res - Express の Response
 * @returns 204 No Content
 */
export async function deleteBook(req: Request, res: Response) {
  try {
    // delete 成功時だけ body を返さず 204 に変換する。
    const parseResult = validateDeleteBook(req);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
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

    return sendInternalServerError(res, 'Error deleting book:', error);
  }
}
