import express, { Request, Response } from 'express';

import { logger } from '../utils/logger';
import { ReviewParams } from '../types/route-params';
import { authenticateToken } from '../middleware/auth';
import * as reviewService from '../services/review.service';
import { ApiError } from '../errors/ApiError';
import { ERROR_MESSAGES } from '../constants/error-messages';
import {
  validateCreateReview,
  validateUpdateReview,
  validateDeleteReview,
  validateGetReviewDetail,
  validateListReviewsQuery,
} from '../validators/review.validator';

const router = express.Router();

/**
 * GET /api/reviews - レビュー一覧取得（公開）
 *
 * GET /api/reviews - 全レビューをページングで取得します。
 * クエリは文字列だが整数扱い。`page>=1`,`limit=1..100`。
 *
 * @route {GET} /api/reviews
 * @access Public
 * @query {string} [page] - ページ番号（整数文字列、1以上）
 * @query {string} [limit] - 1ページあたり件数（整数文字列、1〜100）
 * @query {string} [bookId] - 本IDで絞り込み（整数文字列）
 * @query {string} [userId] - ユーザーIDで絞り込み（整数文字列）
 *
 * @returns {200} {success:true,data:{reviews:Review[],pagination:Pagination}}
 * @returns {400} {success:false,error:{code:'VALIDATION_ERROR',details:[{path,message}]}}
 * @returns {500} 内部エラー
 *
 * @example
 * GET /api/reviews?page=1&limit=20 → 200 + review list
 * GET /api/reviews?page=abc → 400 VALIDATION_ERROR
 */
router.get('/reviews', async (req: Request, res: Response) => {
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
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }
    logger.error('[REVIEWS GET] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
  }
});

/**
 * GET /api/reviews/:reviewId - レビュー詳細取得（公開）
 *
 * パスの `reviewId` で指定したレビューを取得。認証不要。
 *
 * @route {GET} /api/reviews/:reviewId
 * @access Public
 * @param {string} reviewId.path.required - レビューID
 *
 * @returns {200} {success:true,data:ReviewDetail}
 * @returns {400} VALIDATION_ERROR
 * @returns {404} REVIEW_NOT_FOUND
 * @returns {500} Internal Server Error
 *
 * @example
 * GET /api/reviews/1 → 200
 * GET /api/reviews/0 → 400
 * GET /api/reviews/9999 → 404
 */
router.get('/reviews/:reviewId', async (req: Request, res: Response) => {
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
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }

    logger.error('[REVIEWS GET DETAIL] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
  }
});

/**
 * DELETE /api/reviews/:reviewId - レビュー削除
 *
 * 所有者によるレビュー削除。関連コメント存在で409。
 *
 * @route {DELETE} /api/reviews/:reviewId
 * @access Private (owner)
 * @param {string} reviewId
 *
 * @returns {204} No Content
 * @returns {400} VALIDATION_ERROR
 * @returns {401} Unauthorized
 * @returns {403} Forbidden
 * @returns {404} REVIEW_NOT_FOUND
 * @returns {409} RELATED_DATA_EXISTS
 * @returns {500} Internal Server Error
 *
 * @example
 * DELETE /api/reviews/5 → 204
 * DELETE /api/reviews/abc → 400
 * DELETE /api/reviews/1000 → 404
 */
router.delete<ReviewParams>('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
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
    });

    return res.sendStatus(204);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }

    logger.error('[REVIEWS DELETE] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * PUT /api/reviews/:reviewId - レビュー更新
 *
 * 所有者が本文を更新する。body に `content` を含む。
 *
 * @route {PUT} /api/reviews/:reviewId
 * @access Private (owner)
 * @param {string} reviewId
 * @body {string} content
 *
 * @returns {200} Updated review
 * @returns {400} VALIDATION_ERROR
 * @returns {401} Unauthorized
 * @returns {403} Forbidden
 * @returns {404} REVIEW_NOT_FOUND
 * @returns {500} Internal Server Error
 *
 * @example
 * PUT /api/reviews/2 {content:"New"} → 200
 * PUT /api/reviews/2 {content:""} → 400
 */

router.put<ReviewParams>('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
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
    });

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }

    logger.error('[REVIEWS PUT] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});
/**
 * POST /api/reviews - レビュー投稿
 *
 * 認証済みユーザーがレビューを作成します。`rating` は 1～5 の
 * 整数（文字列で届く）。`content` は 1～1000 文字。
 *
 * @route {POST} /api/reviews
 * @access Private (user)
 * @body {object} body - JSON
 * @body {number} body.bookId.required - 本ID（整数）
 * @body {string} body.content.required - レビュー本文
 * @body {number} [body.rating] - 評価
 *
 * @returns {201} Created -
 *   { success:true, data: Review }
 * @returns {400} Validation Error - details 配列あり
 * @returns {401} Unauthorized - 認証トークン欠如
 * @returns {404} BOOK_NOT_FOUND - 書籍なし
 * @returns {500} Internal Server Error
 *
 * @example Request/Response
 * POST /api/reviews
 * { "bookId":1, "content":"Nice", "rating":5 }
 * 201 Created
 * { "success":true, "data":{...レビューオブジェクト...} }
 * ---
 * POST /api/reviews
 * { "bookId":0, "content":"" }
 * 400 Bad Request
 * { "success":false,
 *   "error":{ "message":"Validation failed","code":"VALIDATION_ERROR",
 *     "details":[{"path":"bookId","message":"required positive integer"},
 *                {"path":"content","message":"required string"}] } }
 */

router.post<ReviewParams>('/reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
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
      return res.status(error.statusCode).json({
        success: false,
        error: { message: error.message, code: error.code },
      });
    }

    logger.error('[REVIEWS POST] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

export default router;
