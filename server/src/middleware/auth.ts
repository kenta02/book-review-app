// JWT を検証する
// ユーザー情報を取得する
// 失敗時はエラーを返す
// 成功時は req.userId などを設定して next() に進める（重要）

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import User from '../models/Users';
import { ERROR_MESSAGES } from '../constants/error-messages';
import { logger } from '../utils/logger';

// Express の Request 型を拡張して userId プロパティを追加
/* eslint-disable @typescript-eslint/no-namespace -- Express の型拡張に必要 */
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: express.NextFunction
): Promise<void> => {
  // テストや他のミドルウェアで既に user 情報が設定済みならそのまま通す
  if (req.userId !== undefined && req.userId !== null) {
    if (req.userRole !== undefined) {
      return next();
    }

    try {
      const existingUser = await User.findByPk(req.userId);
      if (!existingUser) {
        res.status(401).json({
          success: false,
          error: { message: ERROR_MESSAGES.USER_NOT_FOUND, code: 'USER_NOT_FOUND' },
        });
        return;
      }

      req.userRole = existingUser.toJSON().role;
      return next();
    } catch (error) {
      logger.error('[AUTH-MW] failed to hydrate user role', error);
      res.status(500).json({
        success: false,
        error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
      });
      return;
    }
  }

  // authHeader が存在するか確認
  // 「Bearer 」で始まっているか確認

  const authHeader = req.headers.authorization;

  // Authorization header は攻撃者が操作可能なため、ログインジェクションを防ぐためトークン本体を出力しない。
  const sanitizedHeader = authHeader ? authHeader.split('\r').join('').split('\n').join('') : '';
  const maskedAuthHeader = sanitizedHeader.startsWith('Bearer ') ? 'Bearer <redacted>' : '(none)';
  logger.info('[AUTH-MW] authorization header=', maskedAuthHeader);

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED, code: 'AUTHENTICATION_REQUIRED' },
    });
    return;
  }

  // トークン部分を取り出す(7文字目以降)
  const token = authHeader.substring(7);

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('[AUTH-MW] JWT_SECRET is not configured');
    res.status(500).json({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
    return;
  }

  // JWTを検証
  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: number };
    // req に userId を設定
    const user = await User.findByPk(decoded.id);

    if (user) {
      const userToJson = user.toJSON();
      req.userId = userToJson.id;
      req.userRole = userToJson.role;
      // next() を呼び出して次のミドルウェアへ
      next();
    } else {
      // ユーザーが見つからない場合
      res.status(401).json({
        success: false,
        error: { message: ERROR_MESSAGES.USER_NOT_FOUND, code: 'USER_NOT_FOUND' },
      });
      return;
    }
  } catch (error) {
    logger.error('[AUTH-MW] JWT verification / user lookup failed', error);
    // 401: 認証失敗
    res.status(401).json({
      success: false,
      error: { message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED, code: 'AUTHENTICATION_REQUIRED' },
    });
    return;
  }
};

export const requireAdmin = (req: Request, res: Response, next: express.NextFunction): void => {
  if (req.userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: { message: ERROR_MESSAGES.FORBIDDEN_ADMIN_REQUIRED, code: 'FORBIDDEN' },
    });
    return;
  }

  next();
};
