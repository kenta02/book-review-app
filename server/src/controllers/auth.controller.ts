import { Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as authService from '../services/auth.service';
import { logger } from '../utils/logger';
import { validateLogin, validateRegister } from '../validators/auth.validator';

function sendApiError(res: Response, error: ApiError) {
  return res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
    },
  });
}

function sendInternalServerError(res: Response, logMessage: string) {
  logger.error(logMessage);
  return res.status(500).json({
    success: false,
    error: {
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}

/**
 * ユーザー登録 API ハンドラー。
 *
 * @param req - 登録リクエスト
 * @param res - Express Response
 * @returns 登録結果
 */
export async function register(req: Request, res: Response) {
  try {
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
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, '[AUTH REGISTER] unexpected error occurred');
  }
}

/**
 * ログイン API ハンドラー。
 *
 * @param req - ログインリクエスト
 * @param res - Express Response
 * @returns ログイン結果
 */
export async function login(req: Request, res: Response) {
  try {
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
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, '[AUTH LOGIN] unexpected error occurred');
  }
}

/**
 * 自分のプロフィール取得 API ハンドラー。
 *
 * @param req - 認証済みリクエスト
 * @param res - Express Response
 * @returns プロフィール情報
 */
export async function me(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    const data = await authService.getMyProfile(userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, '[AUTH ME] unexpected error occurred');
  }
}
