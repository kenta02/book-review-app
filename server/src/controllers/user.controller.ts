import { NextFunction, Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import { sendApiError } from '../middleware/errorHandler';
import * as userService from '../services/user.service';
import { logger } from '../utils/logger';
import { validateGetUserProfile } from '../validators/user.validator';

/**
 * ユーザープロフィール取得 API ハンドラー。
 *
 * @param req - プロフィール取得リクエスト
 * @param res - Express Response
 * @returns ユーザー情報
 */
export async function getUserProfile(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
  try {
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
  } catch (error) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    logger.error('[USERS GET PROFILE] unexpected error occurred');
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}
