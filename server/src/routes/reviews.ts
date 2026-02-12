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

export default router;
