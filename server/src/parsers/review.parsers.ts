import { Request } from 'express';

import { CreateReviewDto, UpdateReviewDto, ListReviewsQueryDto } from '../types/dto';

/**
 * バリデーションエラーの型
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string; // エラーコード（INVALID_REVIEW_ID など）
}

/**
 * パース結果（成功/失敗）
 * - Discriminated Union: success: true なら data が存在、success: false なら errors が存在
 */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * POST /api/reviews リクエストをパース
 * - bookId: 整数, 正
 * - content: 文字列, 1-1000文字
 * - rating: 整数（optional), 1-5
 */
export function parseCreateReview(req: Request): ParseResult<CreateReviewDto> {
  const { bookId, content, rating } = req.body;
  const errors: ValidationError[] = [];

  // bookId のバリデーション
  const bookIdNum = Number(bookId);
  if (bookId === undefined || !Number.isInteger(bookIdNum) || bookIdNum <= 0) {
    errors.push({
      field: 'bookId',
      message: 'bookIdは1以上の整数で必須項目です。',
    });
  }

  // content のバリデーション
  const contentStr = typeof content === 'string' ? content : '';
  if (!contentStr || contentStr.length === 0) {
    errors.push({
      field: 'content',
      message: 'contentは文字列で必須項目です。',
    });
  } else if (contentStr.length > 1000) {
    errors.push({
      field: 'content',
      message: 'contentは1000文字以内で入力してください。',
    });
  }

  // rating のバリデーション（optional）
  if (rating !== undefined) {
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.push({
        field: 'rating',
        message: 'ratingは1から5の整数で入力してください。',
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      bookId: bookIdNum,
      content: contentStr,
      rating: rating !== undefined ? Number(rating) : undefined,
    },
  };
}

/**
 * PUT /api/reviews/:reviewId リクエストをパース
 * - reviewId: パスパラメータから抽出, 整数, 正
 * - content: 文字列, 1-1000文字
 */
export function parseUpdateReview(
  req: Request
): ParseResult<UpdateReviewDto & { reviewId: number }> {
  const { content } = req.body;
  const reviewIdStr = req.params.reviewId;
  const errors: ValidationError[] = [];

  // reviewId のバリデーション
  const reviewIdNum = Number(reviewIdStr);
  if (!Number.isInteger(reviewIdNum) || reviewIdNum <= 0) {
    errors.push({
      field: 'reviewId',
      message: '無効なレビューIDです。',
      code: 'INVALID_REVIEW_ID',
    });
  }

  // content のバリデーション
  const contentStr = typeof content === 'string' ? content : '';
  if (!contentStr || contentStr.length === 0) {
    errors.push({
      field: 'content',
      message: 'contentは文字列で必須項目です。',
    });
  } else if (contentStr.length > 1000) {
    errors.push({
      field: 'content',
      message: 'contentは1000文字以内で入力してください。',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      reviewId: reviewIdNum,
      content: contentStr,
    },
  };
}

/**
 * DELETE /api/reviews/:reviewId リクエストをパース
 * - reviewId: パスパラメータから抽出, 整数, 正
 */
export function parseDeleteReview(req: Request): ParseResult<{ reviewId: number }> {
  const reviewIdStr = req.params.reviewId;
  const errors: ValidationError[] = [];

  const reviewIdNum = Number(reviewIdStr);
  if (!Number.isInteger(reviewIdNum) || reviewIdNum <= 0) {
    errors.push({
      field: 'reviewId',
      message: '無効なレビューIDです。',
      code: 'INVALID_REVIEW_ID',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      reviewId: reviewIdNum,
    },
  };
}

/**
 * GET /api/reviews/:reviewId リクエストをパース
 * - reviewId: パスパラメータから抽出, 整数, 正
 */
export function parseGetReviewDetail(req: Request): ParseResult<{ reviewId: number }> {
  const reviewIdStr = req.params.reviewId;
  const errors: ValidationError[] = [];

  const reviewIdNum = Number(reviewIdStr);
  if (!Number.isInteger(reviewIdNum) || reviewIdNum <= 0) {
    errors.push({
      field: 'reviewId',
      message: '無効なレビューIDです。',
      code: 'INVALID_REVIEW_ID',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      reviewId: reviewIdNum,
    },
  };
}

/**
 * GET /api/reviews クエリをパース
 * - page: 1以上（デフォルト 1）
 * - limit: 1-100（デフォルト 20）
 * - bookId: optional, 正の整数
 * - userId: optional, 正の整数
 */
export function parseListReviewsQuery(req: Request): ParseResult<ListReviewsQueryDto> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
  const bookId = req.query.bookId ? Number(req.query.bookId) : undefined;
  const userId = req.query.userId ? Number(req.query.userId) : undefined;

  // bookId, userId が指定された場合の簡単な検証
  const errors: ValidationError[] = [];
  if (bookId !== undefined && (!Number.isInteger(bookId) || bookId <= 0)) {
    errors.push({
      field: 'bookId',
      message: 'bookIdは正の整数で指定してください。',
    });
  }
  if (userId !== undefined && (!Number.isInteger(userId) || userId <= 0)) {
    errors.push({
      field: 'userId',
      message: 'userIdは正の整数で指定してください。',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      page,
      limit,
      bookId,
      userId,
    },
  };
}
