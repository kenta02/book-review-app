import { NextFunction, Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import { sendApiError, sendAuthenticationRequired } from '../middleware/errorHandler';
import * as commentService from '../services/comment.service';
import { logger } from '../utils/logger';
import {
  validateCreateComment,
  validateGetCommentsForReview,
} from '../validators/comment.validator';

/**
 * コメント一覧取得 API ハンドラー。
 *
 * @param req - 一覧取得リクエスト
 * @param res - Express Response
 * @returns コメント一覧
 */
export async function listComments(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
  try {
    const parseResult = validateGetCommentsForReview(req);
    if (!parseResult.success) {
      const firstErrorCode = parseResult.errors?.[0]?.code || 'VALIDATION_ERROR';
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: firstErrorCode,
          details: parseResult.errors,
        },
      });
    }

    const comments = await commentService.listComments(parseResult.data.reviewId);

    return res.json({ success: true, data: { comments } });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    logger.error('[COMMENTS GET] unexpected error occurred');
    return res.status(500).json({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
  }
}

/**
 * コメント作成 API ハンドラー。
 *
 * @param req - 作成リクエスト
 * @param res - Express Response
 * @returns 作成後コメント
 */
export async function createComment(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendAuthenticationRequired(res);
    }

    const parseResult = validateCreateComment(req);
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

    const created = await commentService.createComment({ ...parseResult.data, userId });
    return res.status(201).json({ success: true, data: created });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    logger.error('[COMMENTS POST] unexpected error occurred');
    return res.status(500).json({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
  }
}
