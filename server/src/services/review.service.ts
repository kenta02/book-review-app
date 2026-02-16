import Review from '../models/Review';
import Book from '../models/Book';
import Comment from '../models/Comment';
import User from '../models/Users';
import { sequelize } from '../sequelize';
import {
  ReviewDto,
  ReviewDetailDto,
  CreateReviewServiceDto,
  UpdateReviewServiceDto,
  DeleteReviewServiceDto,
  ListReviewsQueryDto,
} from '../types/dto';
import { logger } from '../utils/logger';

/**
 * API エラー（service から route へ）
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

/**
 * Model → DTO への変換
 */
function reviewModelToDto(model: unknown): ReviewDto {
  const json = (
    typeof (model as { toJSON?: unknown }).toJSON === 'function'
      ? (model as { toJSON: () => Record<string, unknown> }).toJSON()
      : model
  ) as Record<string, unknown>;
  return {
    id: Number(json.id),
    bookId: Number(json.bookId),
    userId: json.userId === null || json.userId === undefined ? null : Number(json.userId),
    content: String(json.content),
    rating: json.rating === undefined ? undefined : Number(json.rating),
    createdAt: String(json.createdAt),
    updatedAt: String(json.updatedAt),
  };
}

/**
 * GET /api/reviews - レビュー一覧取得
 * @param queryDto - クエリパラメータ (page, limit, bookId?, userId?)
 * @returns レビューとページング情報
 */
export async function listReviews(queryDto: ListReviewsQueryDto): Promise<{
  reviews: ReviewDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}> {
  const { page, limit, bookId, userId } = queryDto;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (bookId !== undefined) where.bookId = bookId;
  if (userId !== undefined) where.userId = userId;

  logger.info('[REVIEWS SERVICE] executing DB query', { where, page, limit, offset });

  const { rows, count } = await Review.findAndCountAll({
    where,
    attributes: ['id', 'bookId', 'userId', 'content', 'rating', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  logger.info('[REVIEWS SERVICE] db returned rows=', rows.length, 'count=', count);

  return {
    reviews: rows.map(reviewModelToDto),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: limit,
    },
  };
}

/**
 * GET /api/reviews/:reviewId - レビュー詳細取得
 * @param reviewId - レビューID
 * @returns レビュー詳細（本のタイトル、ユーザー名を含む）
 * @throws {ApiError} 404 REVIEW_NOT_FOUND
 */
export async function getReviewDetail(reviewId: number): Promise<ReviewDetailDto> {
  const found = await Review.findByPk(reviewId, {
    include: [
      { model: User, attributes: ['id', 'username'] },
      { model: Book, attributes: ['id', 'title'] },
    ],
  });

  if (!found) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', '指定されたレビューが存在しません。');
  }

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

  return {
    id: foundJson.id,
    bookId: foundJson.bookId,
    bookTitle: foundJson.Book ? foundJson.Book.title : undefined,
    userId: foundJson.userId === undefined ? null : foundJson.userId,
    username: foundJson.User ? foundJson.User.username : undefined,
    content: foundJson.content,
    rating: foundJson.rating,
    createdAt: String(foundJson.createdAt),
    updatedAt: String(foundJson.updatedAt),
  };
}

/**
 * POST /api/reviews - レビュー作成
 * @param serviceDto - レビュー作成情報 (bookId, userId, content, rating)
 * @returns 作成されたレビュー
 * @throws {ApiError} 404 BOOK_NOT_FOUND
 */
export async function createReview(serviceDto: CreateReviewServiceDto): Promise<ReviewDto> {
  const { bookId, content, rating, userId } = serviceDto;

  // Book が存在するか確認
  const book = await Book.findByPk(bookId);
  if (!book) {
    throw new ApiError(404, 'BOOK_NOT_FOUND', '指定された本が存在しません。');
  }

  // レビュー作成
  const newReview = await Review.create({
    bookId,
    userId,
    content,
    rating,
  });

  logger.info('[REVIEWS SERVICE] review created', { reviewId: newReview.get('id'), userId });

  return reviewModelToDto(newReview);
}

/**
 * PUT /api/reviews/:reviewId - レビュー更新
 * 所有者のみ更新可能
 * @param serviceDto - 更新情報 (reviewId, userId, content)
 * @returns 更新後のレビュー
 * @throws {ApiError} 404 REVIEW_NOT_FOUND / 403 FORBIDDEN
 */
export async function updateReview(serviceDto: UpdateReviewServiceDto): Promise<ReviewDto> {
  const { reviewId, content, userId } = serviceDto;

  // レビュー取得
  const review = await Review.findByPk(reviewId);
  if (!review) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', '指定されたレビューが存在しません。');
  }

  // 権限チェック（所有者確認）
  if (Number(review.get('userId')) !== Number(userId)) {
    throw new ApiError(403, 'FORBIDDEN', 'このレビューを更新する権限がありません。');
  }

  // 更新
  const updated = await review.update({ content });

  logger.info('[REVIEWS SERVICE] review updated', { reviewId, userId });

  return reviewModelToDto(updated);
}

/**
 * DELETE /api/reviews/:reviewId - レビュー削除
 * 所有者のみ削除可能。関連コメント存在時は削除不可
 * @param serviceDto - 削除情報 (reviewId, userId)
 * @throws {ApiError} 404 REVIEW_NOT_FOUND / 403 FORBIDDEN / 409 RELATED_DATA_EXISTS
 */
export async function deleteReview(serviceDto: DeleteReviewServiceDto): Promise<void> {
  const { reviewId, userId } = serviceDto;

  // レビュー取得
  const review = await Review.findByPk(reviewId);
  if (!review) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', '指定されたレビューが存在しません。');
  }

  // 権限チェック（所有者確認）
  if (Number(review.get('userId')) !== Number(userId)) {
    throw new ApiError(403, 'FORBIDDEN', 'このレビューを削除する権限がありません。');
  }

  // トランザクション開始
  const transaction = await sequelize.transaction();
  try {
    // 関連コメントがある場合は削除不可
    const hasComments = await Comment.findOne({
      where: { reviewId },
      attributes: ['id'],
      transaction,
    });

    if (hasComments) {
      await transaction.rollback();
      throw new ApiError(
        409,
        'RELATED_DATA_EXISTS',
        'このレビューには関連するコメントが存在するため、削除できません。'
      );
    }

    // レビュー削除
    await review.destroy({ transaction });
    await transaction.commit();

    logger.info('[REVIEWS SERVICE] review deleted', { reviewId, userId });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
