import { commentModelToDto } from '../utils/mapper';
import { logger } from '../utils/logger';
import type { CommentDto, CreateCommentServiceDto } from '../modules/comment/dto/comment.dto';
import { ApiError } from '../errors/ApiError';
import { ERROR_MESSAGES } from '../constants/error-messages';
import * as commentRepository from '../repositories/comment.repository';

/**
 * reviewId に紐づくコメントを取得し、返信をネストした形で返す。
 *
 * @param reviewId - レビュー ID
 * @returns トップレベルコメント配列（replies 配列付き）
 */
export async function listComments(reviewId: number): Promise<CommentDto[]> {
  logger.info('[COMMENTS SERVICE] listComments for reviewId=', reviewId);

  const rows = await commentRepository.findCommentsByReviewId(reviewId);

  const dtos = rows.map(commentModelToDto);
  const topLevel = dtos.filter((c) => c.parentId === null);

  return topLevel.map((c) => ({
    ...c,
    replies: dtos.filter((r) => r.parentId === c.id),
  }));
}

/**
 * コメントを新規作成する。
 * reviewId の存在を確認し、parentId があれば関連性を検証する。
 *
 * @param serviceDto - 作成入力
 * @returns 作成されたコメント
 */
export async function createComment(serviceDto: CreateCommentServiceDto): Promise<CommentDto> {
  const { reviewId, content, parentId = null, userId } = serviceDto;

  const foundReview = await commentRepository.findReviewById(reviewId);
  if (!foundReview) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', ERROR_MESSAGES.REVIEW_NOT_FOUND);
  }

  if (parentId !== null && parentId !== undefined) {
    const parentComment = await commentRepository.findCommentById(parentId);

    if (!parentComment) {
      throw new ApiError(400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_FAILED, [
        { field: 'parentId', message: ERROR_MESSAGES.PARENT_COMMENT_NOT_FOUND },
      ]);
    }

    if (Number(parentComment.get('reviewId')) !== Number(reviewId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_FAILED, [
        { field: 'parentId', message: ERROR_MESSAGES.PARENT_COMMENT_WRONG_REVIEW },
      ]);
    }
  }

  const newComment = await commentRepository.createComment({
    content,
    reviewId,
    parentId,
    userId,
  });

  logger.info('[COMMENTS SERVICE] comment created', { commentId: newComment.get('id'), userId });

  return commentModelToDto(newComment);
}
