import Favorite from '../models/Favorite';
import Review from '../models/Review';
import User from '../models/Users';

export type UserInstance = NonNullable<Awaited<ReturnType<typeof User.findByPk>>>;

export type CreateUserRepositoryInput = {
  username: string;
  email: string;
  password: string;
};

/**
 * ユーザー名でユーザーを 1 件取得する。
 *
 * @param username - ユーザー名
 * @returns ユーザー、未存在時は null
 */
export async function findUserByUsername(username: string) {
  return User.findOne({ where: { username } });
}

/**
 * メールアドレスでユーザーを 1 件取得する。
 *
 * @param email - メールアドレス
 * @returns ユーザー、未存在時は null
 */
export async function findUserByEmail(email: string) {
  return User.findOne({ where: { email } });
}

/**
 * 主キーでユーザーを取得する。
 *
 * @param userId - ユーザー ID
 * @returns ユーザー、未存在時は null
 */
export async function findUserById(userId: number) {
  return User.findByPk(userId);
}

/**
 * ユーザーを新規作成する。
 *
 * @param data - 作成データ
 * @returns 作成されたユーザー
 */
export async function createUser(data: CreateUserRepositoryInput) {
  return User.create(data);
}

/**
 * 指定ユーザーのレビュー件数を返す。
 *
 * @param userId - ユーザー ID
 * @returns レビュー件数
 */
export async function countReviewsByUserId(userId: number) {
  return Review.count({ where: { userId } });
}

/**
 * 指定ユーザーのお気に入り件数を返す。
 *
 * @param userId - ユーザー ID
 * @returns お気に入り件数
 */
export async function countFavoritesByUserId(userId: number) {
  return Favorite.count({ where: { userId } });
}
