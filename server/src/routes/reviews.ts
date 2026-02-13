import express, { Request, Response } from 'express';

import Review from '../models/Review';
import { logger } from '../utils/logger';
import Comment from '../models/Comment';
import { ReviewParams } from '../types/route-params';
import { sequelize } from '../sequelize';
import { authenticateToken } from '../middleware/auth';
import User from '../models/Users';
import Book from '../models/Book';

const router = express.Router();

/**
 * GET /api/reviews
 * - 公開エンドポイント（認証不要）
 * - クエリ: bookId?, userId?, page?, limit?
 */
router.get('/reviews', async (req: Request, res: Response) => {
  logger.info('[REVIEWS] incoming request query=', req.query);
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.bookId) (where as Record<string, unknown>).bookId = Number(req.query.bookId);
    if (req.query.userId) (where as Record<string, unknown>).userId = Number(req.query.userId);

    logger.info('[REVIEWS] executing DB query', { where, page, limit, offset });

    // avoid eager-loading issues by returning core Review fields only
    const { rows, count } = await Review.findAndCountAll({
      where,
      attributes: ['id', 'bookId', 'userId', 'content', 'rating', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    logger.info('[REVIEWS] db returned rows=', rows.length, 'count=', count);

    const reviews = rows.map((r) => {
      const js = (typeof r.toJSON === 'function' ? r.toJSON() : r) as Record<string, unknown>;
      return {
        id: Number(js.id),
        bookId: Number(js.bookId),
        userId: js.userId === null || js.userId === undefined ? null : Number(js.userId),
        content: String(js.content),
        rating: Number(js.rating),
        createdAt: js.createdAt,
        updatedAt: js.updatedAt,
      };
    });

    return res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    const e = error as { stack?: string } | undefined;
    console.error('[REVIEWS] Error fetching reviews:', e && (e.stack || e));
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
    const reviewId = Number(req.params.reviewId);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: '無効なレビューIDです。', code: 'INVALID_REVIEW_ID' },
      });
    }

    const found = await Review.findByPk(reviewId, {
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Book, attributes: ['id', 'title'] },
      ],
    });

    if (!found) {
      return res.status(404).json({
        success: false,
        error: { message: '指定されたレビューが存在しません。', code: 'REVIEW_NOT_FOUND' },
      });
    }

    // Sequelize Model の直接プロパティ参照は型が厳密ではないため toJSON() で安全に取得
    const foundJson = found.toJSON() as {
      id: number;
      bookId: number;
      Book?: { title?: string } | null;
      userId?: number | null;
      User?: { username?: string } | null;
      content: string;
      rating: number;
      createdAt: Date;
      updatedAt: Date;
    };

    const data = {
      id: foundJson.id,
      bookId: foundJson.bookId,
      bookTitle: foundJson.Book ? foundJson.Book.title : undefined,
      userId: foundJson.userId,
      username: foundJson.User ? foundJson.User.username : undefined,
      content: foundJson.content,
      rating: foundJson.rating,
      createdAt: foundJson.createdAt,
      updatedAt: foundJson.updatedAt,
    };

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching review detail:', error);
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
    // パスパラメータから reviewId を検証してパース
    const reviewId = req.params.reviewId;
    const reviewIdNum = Number(reviewId);
    const isValidId = Number.isInteger(reviewIdNum) && reviewIdNum > 0;
    if (!isValidId) {
      return res.status(400).json({
        success: false,
        error: {
          message: '無効なレビューIDです。',
          code: 'INVALID_REVIEW_ID',
        },
      });
    }

    // 認証: ユーザーが認証されていることを確認
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

    // レビューが存在することを確認
    const targetReview = await Review.findByPk(reviewIdNum);
    if (!targetReview) {
      return res.status(404).json({
        success: false,
        error: {
          message: '指定されたレビューが存在しません。',
          code: 'REVIEW_NOT_FOUND',
        },
      });
    }

    // 認可: 所有者か確認
    if (Number(targetReview.get('userId')) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'このレビューを削除する権限がありません。',
          code: 'FORBIDDEN',
        },
      });
    }

    // トランザクション開始
    const transaction = await sequelize.transaction();
    try {
      // 関連コメントがある場合は削除不可
      const hasComments = await Comment.findOne({
        where: { reviewId: reviewIdNum },
        attributes: ['id'], // id のみ取得
        transaction, // トランザクション内で実行
      });

      if (hasComments) {
        // トランザクションロールバック
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          error: {
            message: 'このレビューには関連するコメントが存在するため、削除できません。',
            code: 'RELATED_DATA_EXISTS',
          },
        });
      }
      // レビュー削除(トランザクション内)
      await targetReview.destroy({ transaction });

      // トランザクションコミット
      await transaction.commit();

      // 成功
      return res.sendStatus(204);
    } catch (error) {
      // トランザクションロールバック
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting review:', error);
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
    const { content } = req.body;

    // 認証チェック（最初）
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

    // reviewIdの形式チェック（早期に）
    const reviewId = Number(req.params.reviewId);
    const isValidId = Number.isInteger(reviewId) && reviewId > 0;
    if (!isValidId) {
      return res.status(400).json({
        success: false,
        error: {
          message: '無効なレビューIDです。',
          code: 'INVALID_REVIEW_ID',
        },
      });
    }

    // レビューの存在確認（早期に）
    const foundReview = await Review.findByPk(reviewId);
    if (!foundReview) {
      return res.status(404).json({
        success: false,
        error: {
          message: '指定されたレビューが存在しません。',
          code: 'REVIEW_NOT_FOUND',
        },
      });
    }

    // 所有者チェック
    if (Number(foundReview.get('userId')) !== Number(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'このレビューを更新する権限がありません。',
          code: 'FORBIDDEN',
        },
      });
    }

    // contentバリデーション
    const errors = [];
    if (!content || typeof content !== 'string') {
      errors.push({
        field: 'content',
        message: 'contentは文字列で必須項目です。',
      });
    } else if (content.length > 1000) {
      errors.push({
        field: 'content',
        message: 'contentは1000文字以内で入力してください。',
      });
    }

    // バリデーションエラーがある場合は400で返す
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
    }

    // 更新処理（結果を確認）
    const updatedReview = await foundReview.update({ content });
    // 成功時
    return res.json({ success: true, data: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
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
