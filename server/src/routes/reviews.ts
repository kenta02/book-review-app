import express, { Request, Response } from 'express';
import Review from '../models/Review';
import Comment from '../models/Comment';
import { ReviewParams } from '../types/route-params';
import { sequelize } from '../sequelize';

const router = express.Router();

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
router.delete('/reviews/:reviewId', async (req: Request<ReviewParams>, res: Response) => {
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
router.put('/reviews/:reviewId', async (req: Request<ReviewParams>, res: Response) => {
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
