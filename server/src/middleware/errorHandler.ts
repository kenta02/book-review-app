import { ErrorRequestHandler, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import { logger } from '../utils/logger';

export type ErrorResponse = {
  message: string;
  code: string;
  details?: { field: string; message: string }[];
};

/**
 * `ApiError` を標準の API エラーレスポンスへ変換して返します。
 *
 * @param res - Express の Response
 * @param error - service / repository 層から送出されたアプリケーション例外
 * @returns 整形済みエラーレスポンス
 */
export function sendApiError(res: Response, error: ApiError): Response {
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
 * 未認証リクエストに対する 401 レスポンスを返します。
 *
 * @param res - Express の Response
 * @returns 認証必須エラーレスポンス
 */
export function sendAuthenticationRequired(res: Response): Response {
  return res.status(401).json({
    success: false,
    error: {
      message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      code: 'AUTHENTICATION_REQUIRED',
    },
  });
}

/**
 * API 全体の共通エラーハンドラ。
 *
 * `ApiError` は定義済みフォーマットで返却し、それ以外は 500 として扱います。
 * controller では `next(error)` で本ハンドラに委譲することを想定します。
 */
export const apiErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;

  if (error instanceof ApiError) {
    sendApiError(res, error);
    return;
  }

  const typedError = error as {
    status?: number;
    statusCode?: number;
    type?: string;
    message?: string;
  };
  const status = typedError.status ?? typedError.statusCode;
  const errorType = typedError.type;

  if (status === 413 || errorType === 'entity.too.large') {
    res.status(413).json({
      success: false,
      error: {
        message: typedError.message || 'Payload too large',
        code: 'PAYLOAD_TOO_LARGE',
      },
    });
    return;
  }

  logger.error('[ERROR-HANDLER] unexpected error occurred', error);
  res.status(500).json({
    success: false,
    error: {
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
};
