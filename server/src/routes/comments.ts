import express, { Request, Response } from 'express';

import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import * as commentService from '../services/comment.service';
import {
  validateGetCommentsForReview,
  validateCreateComment,
} from '../validators/comment.validator';
import type { CreateCommentDto } from '../types/dto';

const router = express.Router();

/**
 * GET /api/reviews/:reviewId/comments - レビューのコメント一覧取得
 */
router.get('/reviews/:reviewId/comments', async (req: Request, res: Response) => {
  try {
    const parseResult = validateGetCommentsForReview(req);
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

    const comments = await commentService.listComments(parseResult.data.reviewId);

    return res.json({ success: true, data: { comments } });
  } catch (error) {
    if (error instanceof commentService.ApiError) {
      // サービス層のエラー（details を含む場合はそれを返す）
      const err: any = { message: error.message, code: error.code };
      if (error.details) err.details = error.details;
      return res.status(error.statusCode).json({ success: false, error: err });
    }

    logger.error('[COMMENTS GET] Error fetching comments:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
});

/**
 * POST /api/reviews/:reviewId/comments - レビューにコメントを追加
 */
router.post(
  '/reviews/:reviewId/comments',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: '認証が必要です。', code: 'AUTHENTICATION_REQUIRED' },
        });
      }

      const parseResult = validateCreateComment(req);
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

      const created = await commentService.createComment({ ...parseResult.data, userId });
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      if (error instanceof commentService.ApiError) {
        const err: any = { message: error.message, code: error.code };
        if (error.details) err.details = error.details;
        return res.status(error.statusCode).json({ success: false, error: err });
      }

      logger.error('[COMMENTS POST] Error creating comment:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }
);

export default router;
