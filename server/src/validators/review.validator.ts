import { Request } from 'express';

import { CreateReviewDto, UpdateReviewDto, ListReviewsQueryDto } from '../types/dto';
import { ValidationMessages } from './messages';

/**
 * バリデーションエラーの型
 * @property {string} field - エラーが発生したフィールド名
 * @property {string} message - ユーザー向けのエラーメッセージ
 * @property {string} [code] - プログラム的に処理するためのエラーコード（例：INVALID_REVIEW_ID）
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string; // エラーコード（INVALID_REVIEW_ID など）
}

/**
 * バリデーション結果の型定義
 * Discriminated Union パターンで成功・失敗を型安全に表現
 * @template T - 成功時のデータ型
 * @typedef {Object} ParseResult
 * @property {boolean} success - バリデーション成功フラグ
 * @property {T} [data] - success=true の場合のみ存在
 * @property {ValidationError[]} [errors] - success=false の場合のみ存在
 */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * POST /api/reviews リクエストボディをバリデーション
 *
 * 書評作成時のリクエストボディ（bookId, content, rating）を検証します。
 * 構文的なチェック（型変換、必須チェック、範囲チェック）を行い、
 * エラー情報の配列または正規化されたデータを返します。
 *
 * @param {Request} req - Express Request オブジェクト（req.body を使用）
 * @returns {ParseResult<CreateReviewDto>}
 *   - success=true: 正規化・型変換されたデータ
 *   - success=false: ValidationError[] 配列
 *
 * @example
 * // 正常系
 * const result = validateCreateReview(req);
 * if (result.success) {
 *   const { bookId, content, rating } = result.data;
 *   await reviewService.createReview({ bookId, content, rating, userId });
 * }
 *
 * @example
 * // エラー系
 * const result = validateCreateReview(req);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.errors });
 * }
 *
 * @description
 * 検証ルール:
 * - bookId: 必須、正の整数
 * - content: 必須、1～1000文字の文字列
 * - rating: オプション、1～5の整数
 */
export function validateCreateReview(req: Request): ParseResult<CreateReviewDto> {
  const { bookId, content, rating } = req.body;
  const errors: ValidationError[] = [];

  // bookId のバリデーション
  const bookIdNum = Number(bookId);
  if (bookId === undefined || !Number.isInteger(bookIdNum) || bookIdNum <= 0) {
    errors.push({
      field: 'bookId',
      message: ValidationMessages.REQUIRED_POSITIVE_INTEGER('bookId'),
    });
  }

  // content のバリデーション
  const contentStr = typeof content === 'string' ? content : '';
  if (!contentStr || contentStr.length === 0) {
    errors.push({
      field: 'content',
      message: ValidationMessages.REQUIRED_STRING('content'),
    });
  } else if (contentStr.length > 1000) {
    errors.push({
      field: 'content',
      message: ValidationMessages.STRING_LENGTH_EXCEEDED('content', 1000),
    });
  }

  // rating のバリデーション（optional）
  if (rating !== undefined) {
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.push({
        field: 'rating',
        message: ValidationMessages.RATING_MUST_BE_1_TO_5,
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
 * PUT /api/reviews/:reviewId リクエストをバリデーション
 *
 * 書評更新時のパスパラメータ（reviewId）と
 * リクエストボディ（content）を検証します。
 *
 * @param {Request} req - Express Request オブジェクト（req.params, req.body を使用）
 * @returns {ParseResult<UpdateReviewDto & { reviewId: number }>}
 *   - success=true: { reviewId, content }
 *   - success=false: ValidationError[] 配列
 *
 * @example
 * const result = validateUpdateReview(req);
 * if (result.success) {
 *   await reviewService.updateReview({
 *     reviewId: result.data.reviewId,
 *     content: result.data.content,
 *     userId: req.userId
 *   });
 * }
 *
 * @description
 * 検証ルール:
 * - reviewId: 必須、正の整数（パスパラメータから抽出）
 * - content: 必須、1～1000文字の文字列
 */
export function validateUpdateReview(
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
      message: ValidationMessages.INVALID_REVIEW_ID,
      code: 'INVALID_REVIEW_ID',
    });
  }

  // content のバリデーション
  const contentStr = typeof content === 'string' ? content : '';
  if (!contentStr || contentStr.length === 0) {
    errors.push({
      field: 'content',
      message: ValidationMessages.REQUIRED_STRING('content'),
    });
  } else if (contentStr.length > 1000) {
    errors.push({
      field: 'content',
      message: ValidationMessages.STRING_LENGTH_EXCEEDED('content', 1000),
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
 * DELETE /api/reviews/:reviewId リクエストをバリデーション
 *
 * 書評削除時のパスパラメータ（reviewId）を検証します。
 *
 * @param {Request} req - Express Request オブジェクト（req.params を使用）
 * @returns {ParseResult<{ reviewId: number }>}
 *   - success=true: { reviewId }
 *   - success=false: ValidationError[] 配列
 *
 * @example
 * const result = validateDeleteReview(req);
 * if (result.success) {
 *   await reviewService.deleteReview({
 *     reviewId: result.data.reviewId,
 *     userId: req.userId
 *   });
 * }
 *
 * @description
 * 検証ルール:
 * - reviewId: 必須、正の整数（パスパラメータから抽出）
 */
export function validateDeleteReview(req: Request): ParseResult<{ reviewId: number }> {
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
 * GET /api/reviews/:reviewId リクエストをバリデーション
 *
 * 書評詳細取得時のパスパラメータ（reviewId）を検証します。
 *
 * @param {Request} req - Express Request オブジェクト（req.params を使用）
 * @returns {ParseResult<{ reviewId: number }>}
 *   - success=true: { reviewId }
 *   - success=false: ValidationError[] 配列
 *
 * @example
 * const result = validateGetReviewDetail(req);
 * if (result.success) {
 *   const review = await reviewService.getReviewDetail(result.data.reviewId);
 *   return res.json({ success: true, data: review });
 * }
 *
 * @description
 * 検証ルール:
 * - reviewId: 必須、正の整数（パスパラメータから抽出）
 */
export function validateGetReviewDetail(req: Request): ParseResult<{ reviewId: number }> {
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
 * GET /api/reviews クエリパラメータをバリデーション
 *
 * 書評一覧取得時のクエリパラメータ（page, limit, bookId, userId）を検証します。
 * デフォルト値の設定と値の正規化を行います。
 *
 * @param {Request} req - Express Request オブジェクト（req.query を使用）
 * @returns {ParseResult<ListReviewsQueryDto>}
 *   - success=true: { page, limit, bookId, userId }
 *   - success=false: ValidationError[] 配列
 *
 * @example
 * const result = validateListReviewsQuery(req);
 * if (result.success) {
 *   const reviews = await reviewService.listReviews(result.data);
 *   return res.json({ success: true, data: { reviews } });
 * }
 *
 * @description
 * 検証ルール:
 * - page: オプション、デフォルト 1、最小値 1
 * - limit: オプション、デフォルト 20、範囲 1～100
 * - bookId: オプション、正の整数
 * - userId: オプション、正の整数
 */
export function validateListReviewsQuery(req: Request): ParseResult<ListReviewsQueryDto> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
  const bookId = req.query.bookId ? Number(req.query.bookId) : undefined;
  const userId = req.query.userId ? Number(req.query.userId) : undefined;

  // bookId, userId が指定された場合の簡単な検証
  const errors: ValidationError[] = [];
  if (bookId !== undefined && (!Number.isInteger(bookId) || bookId <= 0)) {
    errors.push({
      field: 'bookId',
      message: ValidationMessages.POSITIVE_INTEGER_REQUIRED('bookId'),
    });
  }
  if (userId !== undefined && (!Number.isInteger(userId) || userId <= 0)) {
    errors.push({
      field: 'userId',
      message: ValidationMessages.POSITIVE_INTEGER_REQUIRED('userId'),
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
