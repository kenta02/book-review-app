import { Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import * as userService from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validateGetUserProfile } from '../validators/user.validator';

/**
 * ユーザープロフィール取得 API ハンドラー。
 *
 * @param req - プロフィール取得リクエスト
 * @param res - Express Response
 * @returns ユーザー情報
 */
export const getUserProfile = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const parseResult = validateGetUserProfile(req);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_USER_ID,
          code: 'INVALID_USER_ID',
          details: parseResult.errors,
        },
      });
    }

    const data = await userService.getUserProfile(parseResult.data.userId);
    return res.json({ success: true, data });
  }
);
