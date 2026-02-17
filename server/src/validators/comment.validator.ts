import { Request } from 'express';

import { CreateCommentDto } from '../types/dto';
import { ValidationError, ParseResult } from './review.validator';
import { ValidationMessages } from './messages';

/**
 * GET /api/reviews/:reviewId/comments リクエストをバリデーション
 *
 * コメント一覧取得時のパスパラメータ（reviewId）を検証します。
 *
 * @param {Request} req - Express Request オブジェクト（req.params を使用）
 * @returns {ParseResult<{ reviewId: number }>}
 *   - success=true: { reviewId }
 *   - success=false: ValidationError[] 配列
 *
 * @example
 * const result = validateGetCommentsForReview(req);
 * if (result.success) {
 *   const comments = await commentService.listComments(result.data.reviewId);
 *   return res.json({ success: true, data: { comments } });
 * }
 *
 * @description
 * 検証ルール:
 * - reviewId: 必須、正の整数（パスパラメータから抽出）
 */
export function validateGetCommentsForReview(req: Request): ParseResult<{ reviewId: number }> {
  const reviewIdStr = req.params.reviewId;
  const errors: ValidationError[] = [];

  const reviewIdNum = Number(reviewIdStr);
  if (!Number.isInteger(reviewIdNum) || reviewIdNum <= 0) {
    errors.push({
      field: 'reviewId',
      message: ValidationMessages.INVALID_REVIEW_ID,
      code: 'INVALID_REVIEW_ID',
    });
  }

  if (errors.length > 0) return { success: false, errors };

  return { success: true, data: { reviewId: reviewIdNum } };
}

/**
 * POST /api/reviews/:reviewId/comments リクエストをバリデーション
 *
 * コメント作成時のパスパラメータ（reviewId）と
 * リクエストボディ（content, parentId）を検証します。
 * 構文的なチェックのみ行い、ビジネスルール検証（親コメントの存在確認等）は
 * Service 層で行います。
 *
 * @param {Request} req - Express Request オブジェクト（req.params, req.body を使用）
 * @returns {ParseResult<{ reviewId: number; content: string; parentId?: number | null }>}
 *   - success=true: { reviewId, content, parentId }
 *   - success=false: ValidationError[] 配列
 *
 * @example
 * const result = validateCreateComment(req);
 * if (result.success) {
 *   const comment = await commentService.createComment({
 *     ...result.data,
 *     userId: req.userId
 *   });
 *   return res.status(201).json({ success: true, data: comment });
 * }
 *
 * @description
 * 検証ルール:
 * - reviewId: 必須、正の整数（パスパラメータから抽出）
 * - content: 必須、1～10000文字の文字列（先頭末尾の空白は削除）
 * - parentId: オプション、正の整数（返信コメント用）
 *
 * @note
 * 親コメントの存在確認は Service 層で行うため、ここでは型チェックのみです。
 */
export function validateCreateComment(
  req: Request
): ParseResult<{ reviewId: number; content: string; parentId?: number | null }> {
  const reviewIdStr = req.params.reviewId;
  const { content, parentId } = req.body as CreateCommentDto;
  const errors: ValidationError[] = [];

  const reviewIdNum = Number(reviewIdStr);
  if (!Number.isInteger(reviewIdNum) || reviewIdNum <= 0) {
    errors.push({
      field: 'reviewId',
      message: ValidationMessages.INVALID_REVIEW_ID,
      code: 'INVALID_REVIEW_ID',
    });
  }

  const contentStr = typeof content === 'string' ? content.trim() : '';
  if (!contentStr || contentStr.length === 0) {
    errors.push({ field: 'content', message: ValidationMessages.COMMENT_CONTENT_REQUIRED });
  } else if (contentStr.length > 10000) {
    errors.push({
      field: 'content',
      message: ValidationMessages.STRING_LENGTH_EXCEEDED('content', 10000),
    });
  }

  if (parentId !== undefined && parentId !== null) {
    const parentNum = Number(parentId);
    if (!Number.isInteger(parentNum) || parentNum <= 0) {
      errors.push({
        field: 'parentId',
        message: ValidationMessages.PARENT_ID_MUST_BE_POSITIVE,
      });
    }
  }

  if (errors.length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      reviewId: reviewIdNum,
      content: contentStr,
      parentId: parentId === undefined ? undefined : parentId,
    },
  };
}
