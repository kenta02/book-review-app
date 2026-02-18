import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/Users';
import { authenticateToken } from '../middleware/auth';
import { ERROR_MESSAGES } from '../constants/error-messages';

const router = express.Router();

/**
 * POST /api/auth/register - ユーザー登録
 *
 * パスワードをハッシュ化して DB に保存し、JWT トークンを返す
 *
 * Request body: {
 *   username: string (required, 3-150 chars)
 *   email: string (required, valid email format)
 *   password: string (required, minimum 8 chars)
 * }
 * Responses:
 * 201 Created: user registered successfully
 * 400 Bad Request: validation error
 * 409 Conflict: username or email already exists
 * 500 Internal Server Error
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    console.debug('Received registration data:', req.body);

    const errors = [];
    if (!username || typeof username !== 'string' || username.length < 2 || username.length > 150) {
      errors.push({
        field: 'username',
        message: ERROR_MESSAGES.USERNAME_LENGTH,
      });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: 'email',
        message: ERROR_MESSAGES.EMAIL_FORMAT,
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      errors.push({
        field: 'password',
        message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH,
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
    }

    // username 重複チェック
    if (username) {
      const existingUserName = await User.findOne({ where: { username } });
      if (existingUserName) {
        return res.status(409).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.DUPLICATE_USERNAME,
            code: 'DUPLICATE_RESOURCE',
          },
        });
      }
    }

    // email 重複チェック
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.DUPLICATE_EMAIL,
            code: 'DUPLICATE_RESOURCE',
          },
        });
      }
    }

    // パスワード平文を DB に保存しない：bcrypt でハッシュ化（ソルト 10）
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const userJson = newUser.toJSON();
    const jwtSecret = (process.env.JWT_SECRET || 'dev_secret_key_12345') as string;

    // JWT ペイロード: 機密情報（パスワード等）は含めない
    const jwtPayload = {
      username: userJson.username,
      email: userJson.email,
      id: userJson.id,
    };

    const token = jwt.sign(jwtPayload, jwtSecret, {
      expiresIn: '30d',
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userJson.id,
          username: userJson.username,
          email: userJson.email,
        },
        token: token,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * POST /api/auth/login - ログイン認証
 *
 * email とパスワードで認証し、JWT トークンを返す（失敗時は 401）
 *
 * Request body: {
 *   email: string (required, valid email format)
 *   password: string (required, minimum 8 chars)
 * }
 * Responses:
 * 200 OK: authentication successful
 * 400 Bad Request: validation error
 * 401 Unauthorized: authentication failed
 * 500 Internal Server Error
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.info('Received login data:', req.body);

    const errors = [];
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: 'email',
        message: ERROR_MESSAGES.EMAIL_FORMAT,
      });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      errors.push({
        field: 'password',
        message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH,
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
    }

    const existUser = await User.findOne({ where: { email } });
    if (!existUser) {
      return res.status(401).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.AUTHENTICATION_FAILED,
          code: 'AUTHENTICATION_FAILED',
        },
      });
    }

    // bcrypt.compare: 平文とハッシュを比較（戻り値: true/false）
    const isPasswordVaild = await bcrypt.compare(password, existUser.toJSON().password as string);

    if (isPasswordVaild) {
      const jwtSecret = (process.env.JWT_SECRET || 'dev_secret_key_12345') as string;
      const userJson = existUser.toJSON();

      const jwtPayload = {
        username: userJson.username,
        email: userJson.email,
        id: userJson.id,
      };

      const token = jwt.sign(jwtPayload, jwtSecret, {
        expiresIn: '30d',
      });

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: userJson.id,
            username: userJson.username,
            email: userJson.email,
          },
          token: token,
        },
      });
    } else {
      // 401: 認証失敗（404 ではない）
      return res.status(401).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.PASSWORD_MISMATCH,
          code: 'AUTHENTICATION_FAILED',
        },
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * GET /api/auth/me - 現在のユーザー情報取得
 *
 * 認証ミドルウェアで取得した userId を使ってユーザー情報を取得
 *
 * Headers: Authorization: Bearer <token> (required)
 * Responses:
 * 200 OK: user info retrieved
 * 404 Not Found: user not found
 * 401 Unauthorized: authentication required
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  // ミドルウェアで取得した userId を使ってユーザー情報を取得
  const user = await User.findByPk(req.userId);
  if (user) {
    const userJson = user.toJSON();
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: userJson.id,
          username: userJson.username,
          email: userJson.email,
        },
      },
    });
  } else {
    return res.status(404).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.USER_NOT_FOUND,
        code: 'USER_NOT_FOUND',
      },
    });
  }
});

export default router;
