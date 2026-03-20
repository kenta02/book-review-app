import { Transaction } from 'sequelize';

import Book from '../models/Book';
import Comment from '../models/Comment';
import Review from '../models/Review';
import User from '../models/Users';
import { sequelize } from '../sequelize';

export type ReviewInstance = InstanceType<typeof Review>;
export type BookInstance = InstanceType<typeof Book>;
export type CommentInstance = InstanceType<typeof Comment>;

export type FindReviewsWithPaginationInput = {
  where: Record<string, unknown>;
  limit: number;
  offset: number;
};

export type CreateReviewRepositoryInput = {
  bookId: number;
  userId: number;
  content: string;
  rating?: number;
};

/**
 * 条件付きでレビュー一覧と総件数を取得する。
 *
 * @param input - where, limit, offset
 * @returns rows と count
 */
export type FindReviewsWithPaginationResult = {
  rows: ReviewInstance[];
  count: number;
};

export async function findReviewsWithPagination(
  input: FindReviewsWithPaginationInput
): Promise<FindReviewsWithPaginationResult> {
  const result = await Review.findAndCountAll({
    where: input.where,
    attributes: ['id', 'bookId', 'userId', 'content', 'rating', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
    limit: input.limit,
    offset: input.offset,
  });

  // `group` を指定していないため、`count` は数値（number）として返されます。
  return {
    rows: result.rows,
    count: result.count,
  };
}

/**
 * レビュー詳細を関連情報（User, Book）付きで取得する。
 *
 * @param reviewId - レビュー ID
 * @returns レビュー、未存在時は null
 */
export async function findReviewDetailById(reviewId: number): Promise<ReviewInstance | null> {
  return Review.findByPk(reviewId, {
    include: [
      { model: User, attributes: ['id', 'username'] },
      { model: Book, attributes: ['id', 'title'] },
    ],
  });
}

/**
 * 主キーでレビューを取得する。
 *
 * @param reviewId - レビュー ID
 * @returns レビュー、未存在時は null
 */
export async function findReviewById(reviewId: number): Promise<ReviewInstance | null> {
  return Review.findByPk(reviewId);
}

/**
 * 主キーで本を取得する。
 *
 * @param bookId - 本 ID
 * @returns 本、未存在時は null
 */
export async function findBookById(bookId: number): Promise<BookInstance | null> {
  return Book.findByPk(bookId);
}

/**
 * レビューを新規作成する。
 *
 * @param data - 作成データ
 * @returns 作成されたレビュー
 */
export async function createReview(data: CreateReviewRepositoryInput): Promise<ReviewInstance> {
  return Review.create(data);
}

/**
 * 取得済みレビューの本文を更新する。
 *
 * @param review - 更新対象レビュー
 * @param content - 新しい本文
 * @returns 更新後レビュー
 */
export async function updateReviewContent(
  review: ReviewInstance,
  content: string
): Promise<ReviewInstance> {
  return review.update({ content });
}

/**
 * 指定レビューに紐づくコメントが存在するか確認する。
 *
 * @param reviewId - レビュー ID
 * @param transaction - 参照するトランザクション
 * @returns コメント 1 件（なければ null）
 */
export async function findAnyCommentByReviewId(
  reviewId: number,
  transaction: Transaction
): Promise<CommentInstance | null> {
  return Comment.findOne({
    where: { reviewId },
    attributes: ['id'],
    transaction,
  });
}

/**
 * 取得済みレビューを削除する。
 *
 * @param review - 削除対象レビュー
 * @param transaction - 使用するトランザクション
 */
export async function deleteReview(
  review: ReviewInstance,
  transaction: Transaction
): Promise<void> {
  await review.destroy({ transaction });
}

/**
 * レビュー削除で使うトランザクションを作成する。
 *
 * @returns Sequelize transaction
 */
export async function createTransaction(): Promise<Transaction> {
  return sequelize.transaction();
}
