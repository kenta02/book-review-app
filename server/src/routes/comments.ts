import express, { Request, Response } from 'express';
import Review from '../models/Review';
import Comment from '../models/Comment';
import { CommentParams, ReviewParams } from '../types/route-params';

const router = express.Router();

// GET /api/reviews/:reviewId/comments - レビューのコメント一覧取得
router.get('/reviews/:reviewId/comments', async (req: Request<CommentParams>, res: Response) => {
  try {
    const reviewId = Number(req.params.reviewId);

    const rows = await Comment.findAll({
      where: { reviewId: reviewId },
      order: [['createdAt', 'DESC']],
    });

    // rowの中からparentIdがnullのコメントを抽出
    const topLevelComments = rows.filter((comment) => comment.get('parentId') === null);

    // 各トップレベルのコメントに対して、そのコメントのIdと一致するparentIdを持つコメント」をrepliesとして格納
    const commentWithReplies = topLevelComments.map((comment) => {
      // commentをJSONに変換
      const commentData = comment.toJSON();
      // repliesプロパティを追加し、該当する返信コメントを格納
      commentData.replies = rows
        .filter((reply) => reply.get(`parentId`) === comment.get(`id`))
        .map((reply) => reply.toJSON());
      return commentData;
    });

    console.log(`Found ${rows.length} comments in total for reviewId: ${req.params.reviewId}`);

    // レスポンスにコメントとページネーション情報を含めて返す
    res.json({
      success: true,
      data: {
        comments: commentWithReplies,
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reviews/:reviewId/comments - レビューにコメントを追加
router.post(`/reviews/:reviewId/comments`, async (req: Request<ReviewParams>, res: Response) => {
  // 実装予定
  //   books.ts の POST エンドポイント → 認証・userId 取得の方法を確認
  // 同じパターンを comments.ts の POST にコピー
  // requestBody のバリデーション（reviewId, content, parentId）を追加
});

export default router;
