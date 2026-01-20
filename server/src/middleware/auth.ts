// JWT を検証する
// ユーザー情報を取得する
// 失敗時はエラーを返す
// 成功時は req.userId などを設定して next() に進める ← これが key point

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users';

// Express の Request 型を拡張して userId プロパティを追加
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: express.NextFunction) => {
  // authHeader が存在するか確認
  // 「Bearer 」で始まっているか確認

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'トークンが無い、または無効です。',
        code: 'AUTHENTICATION_FAILED',
      },
    });
  }
  // トークン部分を取り出す(7文字目以降)
  const token = authHeader.substring(7);
  const jwtSecret = (process.env.JWT_SECRET || 'dev_secret_key_12345') as string;

  // JWTを検証
  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: number };
    // req に userId を設定
    const user = await User.findByPk(decoded.id);

    if (user) {
      const userToJson = user.toJSON();
      req.userId = userToJson.id;
      // next() を呼び出して次のミドルウェアへ
      next();
    } else {
      // ユーザーが見つからない場合
      return res.status(401).json({
        success: false,
        error: {
          message: 'ユーザーが見つかりません。',
          code: 'USER_NOT_FOUND',
        },
      });
    }
  } catch (error) {
    // 401: 認証失敗
    return res.status(401).json({
      success: false,
      error: {
        message: 'トークンが無い、または無効です。',
        code: 'AUTHENTICATION_FAILED',
      },
    });
  }
};
