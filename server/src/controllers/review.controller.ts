import { Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { sendAuthenticationRequired } from '../middleware/errorHandler';
import * as reviewService from '../services/review.service';
import { asyncHandler } from '../utils/asyncHandler';
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
export const listReviews = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
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
});

/**
 * レビュー詳細取得 API ハンドラー。
 *
 * @param req - 詳細取得リクエスト
 * @param res - Express Response
 * @returns レビュー詳細
 */
export const getReviewDetail = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
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
  }
);

/**
 * レビュー削除 API ハンドラー。
 *
 * @param req - 削除リクエスト
 * @param res - Express Response
 * @returns 204 No Content
 */
export const deleteReview = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
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
  }
);

/**
 * レビュー更新 API ハンドラー。
 *
 * @param req - 更新リクエスト
 * @param res - Express Response
 * @returns 更新後レビュー
 */
export const updateReview = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
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
  }
);

/**
 * レビュー作成 API ハンドラー。
 *
 * @param req - 作成リクエスト
 * @param res - Express Response
 * @returns 作成後レビュー
 */
export const createReview = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
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
  }
);
