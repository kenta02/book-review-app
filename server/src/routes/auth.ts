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
 * パスワードをハッシュ化して保存し、JWT を発行する。
 *
 * @route {POST} /api/auth/register
 * @access Public
 * @body {string} username
 * @body {string} email
 * @body {string} password
 *
 * @returns {201} 登録成功 + token
 * @returns {400} VALIDATION_ERROR
 * @returns {409} DUPLICATE_RESOURCE
 * @returns {500} Internal Server Error
 *
 * @example Request/Response
 * POST /api/auth/register
 * { "username":"new","email":"new@example.com","password":"password123" }
 * 201 Created
 * { "success":true, "data":{ "user":{ "id":10,"username":"new","email":"new@example.com" },"token":"..." } }
 * ---
 * POST /api/auth/register
 * { "username":"ab","email":"bad","password":"123" }
 * 400 Bad Request
 * { "success":false,"error":{ "message":"Validation failed","code":"VALIDATION_ERROR","details":[{ "path":"username","message":"..."}] } }

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
 * POST /api/auth/login - ログイン
 *
 * メール/パスワードで認証し JWT を返す。
 *
 * @route {POST} /api/auth/login
 * @access Public
 * @body {string} email
 * @body {string} password
 *
 * @returns {200} 成功 + token
 * @returns {400} VALIDATION_ERROR
 * @returns {401} AUTHENTICATION_FAILED
 * @returns {500} Internal Server Error
 *
 * @example Request/Response
 * POST /api/auth/login
 * { "email":"u@example.com","password":"password123" }
 * 200 OK
 * { "success":true, "data":{ "user":{ "id":1,"username":"u","email":"u@example.com" },"token":"..." } }
 * ---
 * POST /api/auth/login
 * { "email":"u@example.com","password":"wrong" }
 * 401 Unauthorized
 * { "success":false, "error":{ "message":"Authentication failed","code":"AUTHENTICATION_FAILED" } }
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
 * GET /api/auth/me - 自分のユーザー情報取得
 *
 * 認証トークン必須。userId で DB 参照。
 *
 * @route {GET} /api/auth/me
 * @access Private (user)
 *
 * @returns {200} ユーザー情報
 * @returns {401} AUTHENTICATION_REQUIRED
 * @returns {404} USER_NOT_FOUND
 *
 * @example Request/Response
 * GET /api/auth/me  (ヘッダにトークン)
 * 200 OK
 * { "success":true, "data":{ "user":{ "id":5,"username":"me","email":"me@example.com" } } }
 * ---
 * GET /api/auth/me  (トークンなし)
 * 401 Unauthorized
 * { "success":false, "error":{ "message":"Authentication required","code":"AUTHENTICATION_REQUIRED" } }
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
