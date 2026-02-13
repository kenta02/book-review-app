import express, { Request, Response } from 'express';

import Review from '../models/Review';
import Comment from '../models/Comment';
import { authenticateToken } from '../middleware/auth';
import { commentModelToDto } from '../utils/mapper';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/reviews/:reviewId/comments - レビューのコメント一覧取得
router.get('/reviews/:reviewId/comments', async (req: Request, res: Response) => {
  try {
    const reviewId = Number(req.params.reviewId);

    const rows = await Comment.findAll({
      where: { reviewId: reviewId },
      order: [['createdAt', 'DESC']],
    });

    // 親子ツリーに整形（top-level + replies）
    const topLevelComments = rows.filter((comment) => comment.get('parentId') === null);

    type LooseComment = Record<string, unknown> & { replies?: unknown[] };
    const commentWithReplies = topLevelComments.map((comment) => {
      const commentData = comment.toJSON() as LooseComment;
      commentData.replies = rows.filter((reply) => reply.get('parentId') === comment.get('id')).map((reply) => reply.toJSON());
      return commentData;
    });

    logger.info(`Found ${rows.length} comments in total for reviewId: ${req.params.reviewId}`);

    // レスポンスにコメントとページネーション情報を含めて返す
    res.json({
      success: true,
      data: {
        comments: commentWithReplies,
      },
    });
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' } });
  }
});

/**
 * POST /api/reviews/:reviewId/comments - レビューにコメントを追加
 * 認証必須。親ID指定時は返信コメント。
 * Request: { content: string, parentId?: number }
 * Returns: 201 (成功), 400 (バリデーション), 401 (認証), 404 (Review なし), 500 (エラー)
 */
router.post(
  '/reviews/:reviewId/comments',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      logger.info('[COMMENTS POST] middleware set req.userId=', req.userId);
      // パラメータ・ボディを取得（以降で順次検証）
      const reviewId = req.params.reviewId;
      const reviewIdNum = Number(reviewId);
      const { content, parentId } = req.body as import('../types/dto').CreateCommentDto;
      const errors: { field: string; message: string }[] = [];

      // 認証チェック（middleware で req.userId を期待）
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: '認証が必要です。', code: 'AUTHENTICATION_REQUIRED' } });
      }

      // reviewId の形式チェック
      if (isNaN(reviewIdNum) || reviewIdNum <= 0) {
        return res.status(400).json({ success: false, error: { message: '無効なレビューIDです。', code: 'INVALID_REVIEW_ID' } });
      }

      // レビューが存在することを確認
      const usefulReview = await Review.findByPk(reviewIdNum);
      if (!usefulReview) {
        return res.status(404).json({ success: false, error: { message: '指定されたレビューが存在しません。', code: 'REVIEW_NOT_FOUND' } });
      }

      // ボディ検証（content の形式・長さ、parentId の存在/所属チェック）
      let trimmedContent = '';

      if (!content || typeof content !== 'string') {
        errors.push({ field: 'content', message: 'コメント内容は文字列である必要があります' });
      } else {
        trimmedContent = content.trim();
        if (trimmedContent.length < 1 || trimmedContent.length > 10000) {
          errors.push({ field: 'content', message: 'コメント内容は1文字以上10000文字以下で入力してください。' });
        }
      }

      if (parentId !== null && parentId !== undefined) {
        if (typeof parentId !== 'number' || !Number.isInteger(parentId) || parentId <= 0) {
          errors.push({ field: 'parentId', message: '親コメントIDは1以上の整数である必要があります。' });
        } else {
          const parentComment = await Comment.findByPk(parentId);
          if (!parentComment) {
            errors.push({ field: 'parentId', message: '指定された親コメントが存在しません。' });
          } else if (parentComment.get('reviewId') !== reviewIdNum) {
            errors.push({ field: 'parentId', message: '親コメントは同じレビューに属している必要があります。' });
          }
        }
      }

      // バリデーション結果をまとめて返す
      if (errors.length > 0) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: errors } });
      }

      // コメント作成（バリデーション済み）
      const newComment = await Comment.create({ content: trimmedContent, reviewId: reviewIdNum, parentId: parentId || null, userId: userId });

      // DTO に変換して返却
      const dto = commentModelToDto(newComment);
      res.status(201).json({ success: true, data: dto });
    } catch (error) {
      // 予期しないエラーはログを残して 500 を返す
      logger.error('Error creating comment:', error);
      res.status(500).json({ success: false, error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' } });
    }
  }
);

export default router;
