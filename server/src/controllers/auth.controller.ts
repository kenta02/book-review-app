import { NextFunction, Request, Response } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import { sendApiError, sendAuthenticationRequired } from '../middleware/errorHandler';
import * as authService from '../services/auth.service';
import { logger } from '../utils/logger';
import { validateLogin, validateRegister } from '../validators/auth.validator';

/**
 * 予期しない例外時に共通の 500 レスポンスを返します。
 *
 * @param res - Express Response
 * @param logMessage - ログ出力する固定メッセージ
 * @returns 500 エラーレスポンス
 */
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
export async function register(
  req: Request,
  res: Response,
  next?: NextFunction
): Promise<Response> {
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
      if (next) {
        next(error);
        return res;
      }
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
export async function login(req: Request, res: Response, next?: NextFunction): Promise<Response> {
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
      if (next) {
        next(error);
        return res;
      }
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
export async function me(req: Request, res: Response, next?: NextFunction): Promise<Response> {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendAuthenticationRequired(res);
    }

    const data = await authService.getMyProfile(userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof ApiError) {
      if (next) {
        next(error);
        return res;
      }
      return sendApiError(res, error);
    }

    return sendInternalServerError(res, '[AUTH ME] unexpected error occurred');
  }
}
