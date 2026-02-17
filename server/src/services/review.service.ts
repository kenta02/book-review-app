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
 * Service 層のエラー表現クラス
 * @property {number} statusCode - HTTP ステータスコード
 * @property {string} code - エラーコード（REVIEW_NOT_FOUND 等）
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
 * Review Model → DTO 型変換
 * @returns {ReviewDto} 型安全な DTO
 */
function reviewModelToDto(model: unknown): ReviewDto {
  // toJSON() を呼び出して JSON 形式を取得
  const json = (
    typeof (model as { toJSON?: unknown }).toJSON === 'function'
      ? (model as { toJSON: () => Record<string, unknown> }).toJSON()
      : model
  ) as Record<string, unknown>;

  // 型を安全に変換（undefined/null チェック付き）
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
 * レビュー一覧取得（ページング・フィルタリング）
 * @param {ListReviewsQueryDto} queryDto - page, limit, bookId?, userId?
 * @returns {Promise<{reviews, pagination}>}
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

  // フィルタ条件構築
  const where: Record<string, unknown> = {};
  if (bookId !== undefined) where.bookId = bookId;
  if (userId !== undefined) where.userId = userId;

  logger.info('[REVIEWS SERVICE] executing DB query', { where, page, limit, offset });

  // DB からレビューを取得（総件数も同時に取得）
  const { rows, count } = await Review.findAndCountAll({
    where,
    attributes: ['id', 'bookId', 'userId', 'content', 'rating', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  logger.info('[REVIEWS SERVICE] db returned rows=', rows.length, 'count=', count);

  // DTO に変換してページング情報と共に返却
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
 * レビュー詳細取得（関連リソース含む）
 * @param {number} reviewId
 * @returns {Promise<ReviewDetailDto>} ユーザー名・本のタイトル含む
 * @throws {ApiError} 404 REVIEW_NOT_FOUND
 */
export async function getReviewDetail(reviewId: number): Promise<ReviewDetailDto> {
  // レビュー取得（ユーザーと本の関連情報も一緒に取得）
  const found = await Review.findByPk(reviewId, {
    include: [
      { model: User, attributes: ['id', 'username'] },
      { model: Book, attributes: ['id', 'title'] },
    ],
  });

  // レビューが存在しない場合は 404 エラーをスロー
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

  // 関連リソース情報を含めてレスポンス構築
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
 * レビュー作成（本の存在確認付き）
 * @param {CreateReviewServiceDto} serviceDto
 * @returns {Promise<ReviewDto>}
 * @throws {ApiError} 404 BOOK_NOT_FOUND
 */
export async function createReview(serviceDto: CreateReviewServiceDto): Promise<ReviewDto> {
  const { bookId, content, rating, userId } = serviceDto;

  // 本が存在するか確認（ビジネス検証）
  const book = await Book.findByPk(bookId);
  if (!book) {
    throw new ApiError(404, 'BOOK_NOT_FOUND', '指定された本が存在しません。');
  }

  // レビュー新規作成
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
 * レビュー更新（所有者のみ）
 * @param {UpdateReviewServiceDto} serviceDto
 * @returns {Promise<ReviewDto>}
 * @throws {ApiError} 404 REVIEW_NOT_FOUND / 403 FORBIDDEN
 */
export async function updateReview(serviceDto: UpdateReviewServiceDto): Promise<ReviewDto> {
  const { reviewId, content, userId } = serviceDto;

  // レビュー取得
  const review = await Review.findByPk(reviewId);
  if (!review) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', '指定されたレビューが存在しません。');
  }

  // 権限チェック：所有者（userId）が一致するか確認
  if (Number(review.get('userId')) !== Number(userId)) {
    throw new ApiError(403, 'FORBIDDEN', 'このレビューを更新する権限がありません。');
  }

  // 内容を更新
  const updated = await review.update({ content });

  logger.info('[REVIEWS SERVICE] review updated', { reviewId, userId });

  return reviewModelToDto(updated);
}

/**
 * レビュー削除（所有者のみ・コメント存在確認）
 * @param {DeleteReviewServiceDto} serviceDto
 * @returns {Promise<void>}
 * @throws {ApiError} 404 REVIEW_NOT_FOUND / 403 FORBIDDEN / 409 RELATED_DATA_EXISTS
 */
export async function deleteReview(serviceDto: DeleteReviewServiceDto): Promise<void> {
  const { reviewId, userId } = serviceDto;

  // レビュー取得
  const review = await Review.findByPk(reviewId);
  if (!review) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', '指定されたレビューが存在しません。');
  }

  // 権限チェック：所有者（userId）が一致するか確認
  if (Number(review.get('userId')) !== Number(userId)) {
    throw new ApiError(403, 'FORBIDDEN', 'このレビューを削除する権限がありません。');
  }

  // トランザクション開始（削除が確実に行われることを保証）
  const transaction = await sequelize.transaction();
  try {
    // 関連コメントの有無確認
    const hasComments = await Comment.findOne({
      where: { reviewId },
      attributes: ['id'],
      transaction,
    });

    // コメントが存在する場合は削除を中止
    if (hasComments) {
      await transaction.rollback();
      throw new ApiError(
        409,
        'RELATED_DATA_EXISTS',
        'このレビューには関連するコメントが存在するため、削除できません。'
      );
    }

    // レビューを削除
    await review.destroy({ transaction });
    await transaction.commit();

    logger.info('[REVIEWS SERVICE] review deleted', { reviewId, userId });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
