import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as userRepository from '../repositories/user.repository';

export type UserProfileDto = {
  id: number;
  username: string;
  reviewCount: number;
  favoriteCount: number;
  createdAt: Date;
};

/**
 * ユーザープロフィールと関連集計を返す。
 *
 * @param userId - 対象ユーザー ID
 * @returns プロフィール情報
 */
export async function getUserProfile(userId: number): Promise<UserProfileDto> {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const [reviewCount, favoriteCount] = await Promise.all([
    userRepository.countReviewsByUserId(userId),
    userRepository.countFavoritesByUserId(userId),
  ]);

  const json = user.toJSON() as { id: number; username: string; createdAt: Date };

  return {
    id: json.id,
    username: json.username,
    reviewCount,
    favoriteCount,
    createdAt: json.createdAt,
  };
}
