import express, { Request, Response } from 'express';

import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import * as commentService from '../services/comment.service';
import { ApiError } from '../errors/ApiError';
import { ERROR_MESSAGES } from '../constants/error-messages';
import {
  validateGetCommentsForReview,
  validateCreateComment,
} from '../validators/comment.validator';

// エラー応答の共通型（ルート内で再利用）
type ErrorResponse = {
  message: string;
  code: string;
  details?: { field: string; message: string }[];
};

const router = express.Router();

/**
 * GET /api/reviews/:reviewId/comments - レビューのコメント一覧取得
 *
 * basePath が `/api` のためフルパスは `/api/reviews/:reviewId/comments`。
 * `reviewId` は整数文字列として受け取り。page/limit も同様に文字列だが
 * 仕様上は整数（>=1）で扱う。
 *
 * @route {GET} /api/reviews/:reviewId/comments
 * @access Public
 * @param {string} reviewId.path.required - レビューID
 * @query {string} [page] - ページ番号（整数文字列、>=1）
 * @query {string} [limit] - 1ページあたり件数（整数文字列、>=1）
 *
 * @returns {200} Success -
 *   { success:true, data:{ comments: Comment[] } }
 *   Comment {id,reviewId,userId,content,createdAt,updatedAt,parentId?}
 * @returns {400} Validation Error - details 配列あり
 * @returns {500} Internal Server Error
 *
 * @example Request/Response
 * GET /api/reviews/5/comments
 * 200 OK
 * { "success":true,
 *   "data":{ "comments":[{ "id":1,"reviewId":5,"userId":2,
 *      "content":"Nice","createdAt":"...","updatedAt":"..." }] } }
 * ---
 * GET /api/reviews/5/comments?page=0
 * 400 Bad Request
 * { "success":false,
 *   "error":{ "message":"Validation failed","code":"VALIDATION_ERROR",
 *     "details":[{"path":"page","message":"must be >=1"}] } }
 */
router.get('/reviews/:reviewId/comments', async (req: Request, res: Response) => {
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
      // サービス層のエラー（details を含む場合はそれを返す）
      const err: ErrorResponse = {
        message: error.message,
        code: error.code,
      };
      if (error.details) err.details = error.details;
      return res.status(error.statusCode).json({ success: false, error: err });
    }

    logger.error('[COMMENTS GET] Error fetching comments:', error);
    return res.status(500).json({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
  }
});

/**
 * POST /api/reviews/:reviewId/comments - レビューにコメントを追加
 *
 * 認証トークン必須。リクエスト body は JSON で
 * `content`(1〜500文字) と省略可の `parentId` を含む。
 *
 * @route {POST} /api/reviews/:reviewId/comments
 * @access Private (user)
 * @param {string} reviewId.path.required - レビューID
 * @body {object} body - JSON
 * @body {string} body.content.required - コメント本文
 * @body {number} [body.parentId] - 親コメントID
 *
 * @returns {201} Created - { success:true, data:Comment }
 * @returns {400} Validation Error - details 配列
 * @returns {401} Unauthorized
 * @returns {404} REVIEW_NOT_FOUND or PARENT_COMMENT_NOT_FOUND
 * @returns {500} Internal Server Error
 *
 * @example Request/Response
 * POST /api/reviews/5/comments
 * { "content":"Agree!" }
 * 201 Created
 * { "success":true, "data":{ "id":10, "reviewId":5, ... } }
 * ---
 * POST /api/reviews/5/comments
 * { "content":"" }
 * 400 Bad Request
 * { "success":false,
 *   "error":{ "message":"Validation failed","code":"VALIDATION_ERROR",
 *     "details":[{"path":"content","message":"required string"}] } }
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
          error: {
            message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
            code: 'AUTHENTICATION_REQUIRED',
          },
        });
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
        const err: ErrorResponse = {
          message: error.message,
          code: error.code,
        };
        if (error.details) err.details = error.details;
        return res.status(error.statusCode).json({ success: false, error: err });
      }

      logger.error('[COMMENTS POST] Error creating comment:', error);
      return res.status(500).json({
        success: false,
        error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }
);

export default router;
