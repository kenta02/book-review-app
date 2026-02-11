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

    console.info(`Found ${rows.length} comments in total for reviewId: ${req.params.reviewId}`);

    // レスポンスにコメントとページネーション情報を含めて返す
    res.json({
      success: true,
      data: {
        comments: commentWithReplies,
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
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
 * POST /api/reviews/:reviewId/comments - レビューにコメントを追加
 * 認証必須。親ID指定時は返信コメント。
 * Request: { content: string, parentId?: number }
 * Returns: 201 (成功), 400 (バリデーション), 401 (認証), 404 (Review なし), 500 (エラー)
 */
router.post(`/reviews/:reviewId/comments`, async (req: Request<ReviewParams>, res: Response) => {
  try {
    // ============================================================================
    // STEP 1: リクエストパラメータとボディの抽出
    // ============================================================================
    const reviewId = req.params.reviewId;
    const reviewIdNum = Number(reviewId);
    const { content, parentId } = req.body;
    const errors = [];

    // ============================================================================
    // STEP 2: 認証チェック
    // ============================================================================
    // コメント投稿にはユーザー認証が必須。認証ミドルウェアで req.userId が設定される想定
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

    // ============================================================================
    // STEP 3: URLパラメータの型チェック（reviewId）
    // ============================================================================
    // reviewId は URL パラメータなので文字列で受け取られる。
    // 無効な形式のID（NaN、0以下の数値）は 400 Bad Request で早期返却
    if (isNaN(reviewIdNum) || reviewIdNum <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: '無効なレビューIDです。',
          code: 'INVALID_REVIEW_ID',
        },
      });
    }

    // ============================================================================
    // STEP 4: レビューの存在確認
    // ============================================================================
    // 指定されたレビューIDに該当するレビューがDB上に存在することを確認。
    // 存在しない場合は 404 Not Found を返す（コメント追加対象がないため）
    const usefulReview = await Review.findByPk(reviewIdNum);
    if (!usefulReview) {
      return res.status(404).json({
        success: false,
        error: {
          message: '指定されたレビューが存在しません。',
          code: 'REVIEW_NOT_FOUND',
        },
      });
    }

    // ============================================================================
    // STEP 5: リクエストボディのバリデーション
    // ============================================================================
    let trimmedContent = '';

    // ----- 5-1: content の型チェック（null, undefined, 非文字列） -----
    // content が文字列でない場合はエラー。型チェックに失敗した場合は
    // 以降の文字数チェックはスキップ（trim()実行時エラー防止）
    if (!content || typeof content !== 'string') {
      errors.push({
        field: 'content',
        message: 'コメント内容は文字列である必要があります',
      });
    } else {
      // ----- 5-2: content の文字数チェック（1〜10000文字） -----
      // 前後の空白を削除した上で、可視文字のみで判定。
      // バリデーション成功時は、trimmedContent に正規化済みの値を格納
      trimmedContent = content.trim();
      if (trimmedContent.length < 1 || trimmedContent.length > 10000) {
        errors.push({
          field: 'content',
          message: 'コメント内容は1文字以上10000文字以下で入力してください。',
        });
      }
    }

    // ----- 5-3: parentId の検証（指定されている場合のみ） -----
    // parentId は省略可能。null/undefined の場合は最上位レベルのコメントとなり、
    // スキップ。指定されている場合は、型チェック → 値チェック（1以上の整数） → DB存在確認 → reviewId一致確認 を実行
    if (parentId !== null && parentId !== undefined) {
      // 型・値チェック: parentId は 1 以上の整数である必要がある
      if (typeof parentId !== 'number' || !Number.isInteger(parentId) || parentId <= 0) {
        errors.push({
          field: 'parentId',
          message: '親コメントIDは1以上の整数である必要があります。',
        });
      } else {
        // DB検索: 指定された parentId が実在するコメントか確認
        const parentComment = await Comment.findByPk(parentId);
        if (!parentComment) {
          errors.push({
            field: 'parentId',
            message: '指定された親コメントが存在しません。',
          });
        } else if (parentComment.get('reviewId') !== reviewIdNum) {
          // セキュリティチェック: 親コメントが同じレビューに属しているか確認
          // （異なるレビューの親コメントを参照させない）
          errors.push({
            field: 'parentId',
            message: '親コメントは同じレビューに属している必要があります。',
          });
        }
      }
    }

    // ============================================================================
    // STEP 6: バリデーション結果の確認
    // ============================================================================
    // すべてのバリデーション処理が完了した時点で、エラーがあれば
    // DB操作を行わずに 400 Bad Request で早期返却。
    // これにより、複数のバリデーションエラーを一度にクライアントに返すことができる
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

    // ============================================================================
    // STEP 7: コメント作成（全バリデーション成功時のみ実行）
    // ============================================================================
    const newComment = await Comment.create({
      content: trimmedContent, // 正規化済みの内容（前後の空白削除済み）
      reviewId: reviewIdNum,
      parentId: parentId || null, // undefined を null に統一（DB要件）
      userId: userId,
    });

    // ============================================================================
    // STEP 8: 成功レスポンス（201 Created）
    // ============================================================================
    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    // ============================================================================
    // エラーハンドリング
    // ============================================================================
    // DB操作中など、予期しないエラーが発生した場合。
    // スタックトレースをログに記録し、クライアントには普遍的なエラーメッセージを返す
    // （セキュリティのため技術的詳細はクライアントに露出させない）
    console.error('Error creating comment:', error);
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
 * DELETE /api/reviews/:id
 *
 * Request: { commentId: number }
 * Returns: 201 (成功), 401(認証), 403(認可), 404(Comment なし), 500 (エラー)
 */
router.delete('/reviews/:reviewId', async (req: Request<ReviewParams>, res: Response) => {
  try {
    // ====================================================================
    // STEP 1: リクエストパラメータの抽出と型チェック
    // ====================================================================
    // - reviewId を URL パラメータから取得し、数値変換。
    // - 無効なID（NaN、0以下）は 400 Bad Request で早期返却。
    // ====================================================================
    // STEP 2: 認証チェック
    // ====================================================================
    // - ユーザー認証必須。req.userId が設定されているか確認。
    // - 未認証時は 401 Unauthorized。
    // ====================================================================
    // STEP 3: レビューの存在確認
    // ====================================================================
    // - Review.findByPk() でレビューが存在するかチェック。
    // - 存在しない場合は 404 Not Found。
    // ====================================================================
    // STEP 4: 認可チェック（所有者確認）
    // ====================================================================
    // - レビュー所有者（userId）がリクエストユーザーと一致するか確認。
    // - 不一致時は 403 Forbidden（他人のレビューは削除不可）。
    // ====================================================================
    // STEP 5: 関連データのチェック（削除可否判定）
    // ====================================================================
    // - レビューに紐づくコメントが存在するか Comment.count() で確認。
    // - コメントがある場合、削除ポリシーを決める（例: 削除不可、またはカスケード削除）。
    // - 関連データがある場合は 409 Conflict（books.ts のように）。
    // ====================================================================
    // STEP 6: レビュー削除実行
    // ====================================================================
    // - 全チェック通過後、Review.destroy() で削除。
    // - カスケード削除が必要なら、関連コメントも削除（ポリシー次第）。
    // ====================================================================
    // STEP 7: 成功レスポンス
    // ====================================================================
    // - 削除成功時は 204 No Content（books.ts 参照）。
  } catch (error) {
    // ====================================================================
    // エラーハンドリング
    // ====================================================================
    // - 予期しないエラー時は 500 Internal Server Error。
    // - ログにエラーを記録。
  }
});
export default router;
