import Comment from '../models/Comment';
import Review from '../models/Review';

export type CommentInstance = InstanceType<typeof Comment>;
export type ReviewInstance = InstanceType<typeof Review>;

export type CreateCommentRepositoryInput = {
  content: string;
  reviewId: number;
  parentId?: number | null;
  userId: number;
};

/**
 * 指定レビューのコメント一覧を取得する。
 *
 * @param reviewId - レビュー ID
 * @returns コメント一覧
 */
export async function findCommentsByReviewId(reviewId: number): Promise<CommentInstance[]> {
  return Comment.findAll({ where: { reviewId }, order: [['createdAt', 'DESC']] });
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
 * 主キーでコメントを取得する。
 *
 * @param commentId - コメント ID
 * @returns コメント、未存在時は null
 */
export async function findCommentById(commentId: number): Promise<CommentInstance | null> {
  return Comment.findByPk(commentId);
}

/**
 * コメントを新規作成する。
 *
 * @param data - 作成データ
 * @returns 作成されたコメント
 */
export async function createComment(data: CreateCommentRepositoryInput): Promise<CommentInstance> {
  return Comment.create(data);
}
