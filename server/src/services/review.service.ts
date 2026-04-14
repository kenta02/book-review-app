import {
  ReviewDto,
  ReviewDetailDto,
  CreateReviewServiceDto,
  UpdateReviewServiceDto,
  DeleteReviewServiceDto,
  ListReviewsQueryDto,
} from '../modules/review/dto/review.dto';
import { logger } from '../utils/logger';
import { ApiError } from '../errors/ApiError';
import { ERROR_MESSAGES } from '../constants/error-messages';
import * as bookRepository from '../repositories/book.repository';
import * as reviewRepository from '../repositories/review.repository';
import { sequelize } from '../sequelize';
import { reviewModelToDto } from '../utils/mapper';

/**
 * レビューのページング取得。bookId/userId による絞り込み可。
 *
 * @param queryDto - 一覧クエリ
 * @returns レビュー一覧とページング情報
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
  const { page, limit } = queryDto;

  logger.info('[REVIEWS SERVICE] executing DB query', queryDto);

  const { rows, count } = await reviewRepository.findReviewsWithPagination(queryDto);

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
 * レビュー ID から詳細を取得（ユーザー名・本タイトル含む）。
 *
 * @param reviewId - レビュー ID
 * @returns レビュー詳細
 */
export async function getReviewDetail(reviewId: number): Promise<ReviewDetailDto> {
  const found = await reviewRepository.findReviewDetailById(reviewId);

  if (!found) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', ERROR_MESSAGES.REVIEW_NOT_FOUND);
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
 * レビューを新規作成する。本の存在を検証する。
 *
 * @param serviceDto - 作成入力
 * @returns 作成済みレビュー
 */
export async function createReview(serviceDto: CreateReviewServiceDto): Promise<ReviewDto> {
  const { bookId, content, rating, userId } = serviceDto;

  const book = await bookRepository.findBookById(bookId);
  if (!book) {
    throw new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND);
  }

  const newReview = await reviewRepository.createReview({
    bookId,
    userId,
    content,
    rating,
  });

  const createdJson =
    typeof (newReview as { toJSON?: unknown }).toJSON === 'function'
      ? (newReview as { toJSON: () => Record<string, unknown> }).toJSON()
      : (newReview as unknown as Record<string, unknown>);

  logger.info('[REVIEWS SERVICE] review created', {
    reviewId: createdJson.id,
    userId,
  });

  return reviewModelToDto(newReview);
}

/**
 * 指定レビューを所有者が更新する。
 *
 * @param serviceDto - 更新入力
 * @returns 更新済みレビュー
 */
export async function updateReview(serviceDto: UpdateReviewServiceDto): Promise<ReviewDto> {
  const { reviewId, content, userId, requesterRole } = serviceDto;

  const review = await reviewRepository.findReviewById(reviewId);
  if (!review) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', ERROR_MESSAGES.REVIEW_NOT_FOUND);
  }

  const isAdmin = requesterRole === 'admin';
  if (!isAdmin && Number(review.get('userId')) !== Number(userId)) {
    throw new ApiError(403, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN_REVIEW_UPDATE);
  }

  const updated = await reviewRepository.updateReviewContent(review, content);

  logger.info('[REVIEWS SERVICE] review updated', { reviewId, userId });

  return reviewModelToDto(updated);
}

/**
 * レビューを所有者が削除する。関連コメントがある場合は 409 を返す。
 *
 * @param serviceDto - 削除入力
 */
export async function deleteReview(serviceDto: DeleteReviewServiceDto): Promise<void> {
  const { reviewId, userId, requesterRole } = serviceDto;

  const review = await reviewRepository.findReviewById(reviewId);
  if (!review) {
    throw new ApiError(404, 'REVIEW_NOT_FOUND', ERROR_MESSAGES.REVIEW_NOT_FOUND);
  }

  const isAdmin = requesterRole === 'admin';
  if (!isAdmin && Number(review.get('userId')) !== Number(userId)) {
    throw new ApiError(403, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN_REVIEW_DELETE);
  }

  await sequelize.transaction(async (transaction) => {
    const hasComments = await reviewRepository.findAnyCommentByReviewId(reviewId, transaction);

    if (hasComments) {
      throw new ApiError(409, 'RELATED_DATA_EXISTS', ERROR_MESSAGES.RELATED_DATA_EXISTS);
    }

    await reviewRepository.deleteReview(review, transaction);
  });

  logger.info('[REVIEWS SERVICE] review deleted', { reviewId, userId });
}
