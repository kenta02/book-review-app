import express, { Request, Response } from 'express';

import { logger } from '../utils/logger';
import { ReviewParams } from '../types/route-params';
import { authenticateToken } from '../middleware/auth';
import * as reviewService from '../services/review.service';
import {
  parseCreateReview,
  parseUpdateReview,
  parseDeleteReview,
  parseGetReviewDetail,
  parseListReviewsQuery,
} from '../parsers/review.parsers';

const router = express.Router();

/**
 * GET /api/reviews
 * - 公開エンドポイント（認証不要）
 * - クエリ: bookId?, userId?, page?, limit?
 */
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const parseResult = parseListReviewsQuery(req);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
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
    logger.error('[REVIEWS GET] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
});

/**
 * GET /api/reviews/:reviewId - レビュー詳細（公開）
 */
router.get('/reviews/:reviewId', async (req: Request, res: Response) => {
  try {
    const parseResult = parseGetReviewDetail(req);

    if (!parseResult.success) {
      const firstErrorCode = parseResult.errors?.[0]?.code || 'VALIDATION_ERROR';
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: firstErrorCode,
          details: parseResult.errors,
        },
      });
    }

    const data = await reviewService.getReviewDetail(parseResult.data.reviewId);

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof reviewService.ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }

    logger.error('[REVIEWS GET DETAIL] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
});

/**
 * DELETE /api/reviews/:reviewId
 *
 * Request body: none
 * Responses:
 *  - 204 No Content: deleted
 *  - 400 Bad Request: invalid ID
 *  - 401 Unauthorized: authentication required
 *  - 403 Forbidden: not owner
 *  - 404 Not Found: review not found
 *  - 409 Conflict: related comments exist
 *  - 500 Internal Server Error
 */
router.delete<ReviewParams>('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: '認証が必要です。',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    const parseResult = parseDeleteReview(req);

    if (!parseResult.success) {
      const firstErrorCode = parseResult.errors?.[0]?.code || 'VALIDATION_ERROR';
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: firstErrorCode,
          details: parseResult.errors,
        },
      });
    }

    await reviewService.deleteReview({
      reviewId: parseResult.data.reviewId,
      userId,
    });

    return res.sendStatus(204);
  } catch (error) {
    if (error instanceof reviewService.ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }

    logger.error('[REVIEWS DELETE] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * PUT /api/reviews/:reviewId - レビュー更新
 *
 * Request body: {
 *   content: string (required, max 1000 chars)
 * }
 * Responses:
 * 200 OK: review updated
 * 400 Bad Request: invalid ID or validation error
 * 401 Unauthorized: authentication required
 * 403 Forbidden: not owner
 * 404 Not Found: review not found
 * 500 Internal Server Error
 */

router.put<ReviewParams>('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: '認証が必要です。',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    const parseResult = parseUpdateReview(req);

    if (!parseResult.success) {
      const firstErrorCode = parseResult.errors?.[0]?.code || 'VALIDATION_ERROR';
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: firstErrorCode,
          details: parseResult.errors,
        },
      });
    }

    const data = await reviewService.updateReview({
      reviewId: parseResult.data.reviewId,
      content: parseResult.data.content,
      userId,
    });

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof reviewService.ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }

    logger.error('[REVIEWS PUT] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});
/**
 * POST /api/reviews - レビュー投稿
 *
 * Request body: {
 *  content: string (required, max 1000 chars)
 *  rating: number (optional, 1-5)
 *  bookId: number (required)
 * }
 * Responses:
 * 201 Created: review created
 * 400 Bad Request: validation error
 * 401 Unauthorized: authentication required
 * 404 Not Found: book not found
 * 500 Internal Server Error
 */

router.post<ReviewParams>('/reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: '認証が必要です。',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    const parseResult = parseCreateReview(req);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
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
    if (error instanceof reviewService.ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }

    logger.error('[REVIEWS POST] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

export default router;
