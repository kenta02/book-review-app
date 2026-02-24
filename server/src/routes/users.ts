import express, { Request, Response } from 'express';

import User from '../models/Users';
import Review from '../models/Review';
import Favorite from '../models/Favorite';
import { UserParams } from '../types/route-params';
import { ERROR_MESSAGES } from '../constants/error-messages';

const router = express.Router();

/**
 * GET /api/users/:id - ユーザープロフィール取得
 *
 * ユーザーの基本情報、レビュー数、お気に入り数を返す。
 *
 * @route {GET} /api/users/:id
 * @access Public
 * @param {string} id.path.required - ユーザーID
 *
 * @returns {200} {success:true,data:{id,username,reviewCount,favoriteCount,createdAt}}
 * @returns {400} INVALID_USER_ID
 * @returns {404} USER_NOT_FOUND
 * @returns {500} Internal Server Error
 *
 * @example GET /api/users/1
 * 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "username": "tanaka",
 *     "reviewCount": 5,
 *     "favoriteCount": 10,
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
router.get('/:id', async (req: Request<UserParams>, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // ユーザー ID の妥当性チェック
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_USER_ID || 'Invalid user ID',
          code: 'INVALID_USER_ID',
        },
      });
    }

    // ユーザーが存在するかチェック
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.USER_NOT_FOUND || 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
    }

    // レビュー数を集計
    const reviewCount = await Review.count({
      where: { userId },
    });

    // お気に入り数を集計
    const favoriteCount = await Favorite.count({
      where: { userId },
    });

    const userJson = user.toJSON();

    res.json({
      success: true,
      data: {
        id: userJson.id,
        username: userJson.username,
        reviewCount,
        favoriteCount,
        createdAt: userJson.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

export default router;
