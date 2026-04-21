import { Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import * as authService from '../services/auth.service';
import { sendAuthenticationRequired } from '../middleware/errorHandler';
import { asyncHandler } from '../utils/asyncHandler';
import { validateLogin, validateRegister } from '../validators/auth.validator';

/**
 * ユーザー登録 API ハンドラー。
 *
 * @param req - 登録リクエスト
 * @param res - Express Response
 * @returns 登録結果
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const parseResult = validateRegister(req);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        code: 'VALIDATION_ERROR',
        details: parseResult.errors,
      },
    });
  }

  const data = await authService.register(parseResult.data);
  return res.status(201).json({ success: true, data });
});

/**
 * ログイン API ハンドラー。
 *
 * @param req - ログインリクエスト
 * @param res - Express Response
 * @returns ログイン結果
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const parseResult = validateLogin(req);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        code: 'VALIDATION_ERROR',
        details: parseResult.errors,
      },
    });
  }

  const data = await authService.login(parseResult.data);
  return res.status(200).json({ success: true, data });
});

/**
 * 自分のプロフィール取得 API ハンドラー。
 *
 * @param req - 認証済みリクエスト
 * @param res - Express Response
 * @returns プロフィール情報
 */
export const me = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
  const userId = req.userId;
  if (!userId) {
    return sendAuthenticationRequired(res);
  }

  const data = await authService.getMyProfile(userId);
  return res.status(200).json({ success: true, data });
});
