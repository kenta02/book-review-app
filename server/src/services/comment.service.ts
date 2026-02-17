import Review from '../models/Review';
import Comment from '../models/Comment';
import { commentModelToDto } from '../utils/mapper';
import { logger } from '../utils/logger';
import type { CommentDto, CreateCommentServiceDto } from '../types/dto';

/**
 * Service 層のエラー表現クラス
 * @property {number} statusCode - HTTP ステータスコード
 * @property {string} code - エラーコード（REVIEW_NOT_FOUND 等）
 * @property {Array<{field, message}>} [details] - バリデーション詳細
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: { field: string; message: string }[]
  ) {
    super(message);
  }
}

/**
 * コメント一覧取得（ツリー構造化）
 * @param {number} reviewId
 * @returns {Promise<CommentDto[]>} トップレベルコメント（replies を含む）
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
 * コメント作成（レビュー・親コメント検証付き）
 * @param {CreateCommentServiceDto} serviceDto
 * @returns {Promise<CommentDto>}
 * @throws {ApiError} 404 REVIEW_NOT_FOUND / 400 VALIDATION_ERROR
 */
export async function createComment(serviceDto: CreateCommentServiceDto): Promise<CommentDto> {
  const { reviewId, content, parentId = null, userId } = serviceDto;

  // 指定レビューが存在するか確認
  const foundReview = await Review.findByPk(reviewId);
  if (!foundReview) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', '指定されたレビューが存在しません。');
  }

  // parentId が指定されている場合は親コメントの存在と所属をチェック
  if (parentId !== null && parentId !== undefined) {
    const parentComment = await Comment.findByPk(parentId);

    // 親コメントが存在しない場合
    if (!parentComment) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', [
        { field: 'parentId', message: '指定された親コメントが存在しません。' },
      ]);
    }

    // 親コメントが別のレビューに属している場合
    if (Number(parentComment.get('reviewId')) !== Number(reviewId)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', [
        { field: 'parentId', message: '親コメントは同じレビューに属している必要があります。' },
      ]);
    }
  }

  // コメント新規作成
  const newComment = await Comment.create({ content, reviewId, parentId, userId });

  logger.info('[COMMENTS SERVICE] comment created', { commentId: newComment.get('id'), userId });

  return commentModelToDto(newComment);
}
