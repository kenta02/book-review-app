import { NextFunction, Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import { sendApiError, sendAuthenticationRequired } from '../middleware/errorHandler';
import * as reviewService from '../services/review.service';
import { logger } from '../utils/logger';
import {
  validateCreateReview,
  validateDeleteReview,
  validateGetReviewDetail,
  validateListReviewsQuery,
  validateUpdateReview,
} from '../validators/review.validator';

/**
 * レビュー一覧取得 API ハンドラー。
 *
 * @param req - 一覧取得リクエスト
 * @param res - Express Response
 * @returns レビュー一覧
 */
export async function listReviews(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
  try {
    const parseResult = validateListReviewsQuery(req);

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

    const result = await reviewService.listReviews(parseResult.data);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    logger.error('[REVIEWS GET] unexpected error occurred');
    return res.status(500).json({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
  }
}

/**
 * レビュー詳細取得 API ハンドラー。
 *
 * @param req - 詳細取得リクエスト
 * @param res - Express Response
 * @returns レビュー詳細
 */
export async function getReviewDetail(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
  try {
    const parseResult = validateGetReviewDetail(req);

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

    const data = await reviewService.getReviewDetail(parseResult.data.reviewId);

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    logger.error('[REVIEWS GET DETAIL] unexpected error occurred');
    return res.status(500).json({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
  }
}

/**
 * レビュー削除 API ハンドラー。
 *
 * @param req - 削除リクエスト
 * @param res - Express Response
 * @returns 204 No Content
 */
export async function deleteReview(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendAuthenticationRequired(res);
    }

    const parseResult = validateDeleteReview(req);

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

    await reviewService.deleteReview({
      reviewId: parseResult.data.reviewId,
      userId,
      ...(req.userRole ? { requesterRole: req.userRole } : {}),
    });

    return res.sendStatus(204);
  } catch (error) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    logger.error('[REVIEWS DELETE] unexpected error occurred');
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
 * レビュー更新 API ハンドラー。
 *
 * @param req - 更新リクエスト
 * @param res - Express Response
 * @returns 更新後レビュー
 */
export async function updateReview(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendAuthenticationRequired(res);
    }

    const parseResult = validateUpdateReview(req);

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

    const data = await reviewService.updateReview({
      reviewId: parseResult.data.reviewId,
      content: parseResult.data.content,
      userId,
      ...(req.userRole ? { requesterRole: req.userRole } : {}),
    });

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    logger.error('[REVIEWS PUT] unexpected error occurred');
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
 * レビュー作成 API ハンドラー。
 *
 * @param req - 作成リクエスト
 * @param res - Express Response
 * @returns 作成後レビュー
 */
export async function createReview(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendAuthenticationRequired(res);
    }

    const parseResult = validateCreateReview(req);

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

    const data = await reviewService.createReview({
      ...parseResult.data,
      userId,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    logger.error('[REVIEWS POST] unexpected error occurred');
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}
