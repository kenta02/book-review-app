import Review from '../models/Review';
import Comment from '../models/Comment';
import { commentModelToDto } from '../utils/mapper';
import { logger } from '../utils/logger';
import type { CommentDto, CreateCommentServiceDto } from '../types/dto';
import { ApiError } from '../errors/ApiError';
import { ERROR_MESSAGES } from '../constants/error-messages';

/**
 * reviewId に紐づくコメントを取得し、返信をネストした形で返す。
 * @param {number} reviewId - レビューID
 * @returns {Promise<CommentDto[]>} トップレベルコメント配列（replies 配列付き）
 */
export async function listComments(reviewId: number): Promise<CommentDto[]> {
  logger.info('[COMMENTS SERVICE] listComments for reviewId=', reviewId);

  // 指定レビューのすべてのコメントを作成日時の降順で取得
  const rows = await Comment.findAll({ where: { reviewId }, order: [['createdAt', 'DESC']] });

  // コメントを DTO に変換
  const dtos = rows.map(commentModelToDto);

  // トップレベルのコメント（parentId === null）を抽出
  const topLevel = dtos.filter((c) => c.parentId === null);

  // 各トップレベルコメントに返信コメントをネストさせる
  const withReplies = topLevel.map((c) => ({
    ...c,
    replies: dtos.filter((r) => r.parentId === c.id),
  }));

  return withReplies;
}

/**
 * コメントを新規作成する。
 * reviewId の存在を確認し、parentId があれば関連性を検証する。
 *
 * @param {CreateCommentServiceDto} serviceDto
 * @returns {Promise<CommentDto>}
 * @throws {ApiError} REVIEW_NOT_FOUND / VALIDATION_ERROR
 */
export async function createComment(serviceDto: CreateCommentServiceDto): Promise<CommentDto> {
  const { reviewId, content, parentId = null, userId } = serviceDto;

  // 指定レビューが存在するか確認
  const foundReview = await Review.findByPk(reviewId);
  if (!foundReview) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', ERROR_MESSAGES.REVIEW_NOT_FOUND);
  }

  // parentId が指定されている場合は親コメントの存在と所属をチェック
  if (parentId !== null && parentId !== undefined) {
    const parentComment = await Comment.findByPk(parentId);

    // 親コメントが存在しない場合
    if (!parentComment) {
      throw new ApiError(400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_FAILED, [
        { field: 'parentId', message: ERROR_MESSAGES.PARENT_COMMENT_NOT_FOUND },
      ]);
    }

    // 親コメントが別のレビューに属している場合
    if (Number(parentComment.get('reviewId')) !== Number(reviewId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_FAILED, [
        { field: 'parentId', message: ERROR_MESSAGES.PARENT_COMMENT_WRONG_REVIEW },
      ]);
    }
  }

  // コメント新規作成
  const newComment = await Comment.create({ content, reviewId, parentId, userId });

  logger.info('[COMMENTS SERVICE] comment created', { commentId: newComment.get('id'), userId });

  return commentModelToDto(newComment);
}
