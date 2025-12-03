import express, { Request, Response } from "express";
import User from "../models/Users";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// POST /api/auth/register - ユーザー登録
// パスワードをハッシュ化して DB に保存し、JWT トークンを返す

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    console.log("Received registration data:", req.body);

    const errors = [];
    if (
      !username ||
      typeof username !== "string" ||
      username.length < 3 ||
      username.length > 150
    ) {
      errors.push({
        field: "username",
        message: "ユーザー名は3~150文字で入力してください.",
      });
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.push({
        field: "email",
        message: "メールアドレスは有効なメール形式で入力してください.",
      });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      errors.push({
        field: "password",
        message: "パスワードは8文字以上で入力してください.",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
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
            message: "同じユーザー名が既に存在します。",
            code: "DUPLICATE_RESOURCE",
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
            message: "同じメールアドレスが既に存在します。",
            code: "DUPLICATE_RESOURCE",
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
    const jwtSecret = (process.env.JWT_SECRET ||
      "dev_secret_key_12345") as string;

    // JWT ペイロード: 機密情報（パスワード等）は含めない
    const jwtPayload = {
      username: userJson.username,
      email: userJson.email,
      id: userJson.id,
    };

    const token = jwt.sign(jwtPayload, jwtSecret, {
      expiresIn: "30d",
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
    res.status(500).json({
      success: false,
      error: {
        message: "サーバーエラーが発生しました。",
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
});

// POST /api/auth/login - ログイン認証
// email とパスワードで認証し、JWT トークンを返す（失敗時は 401）
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("Received login data:", req.body);

    const errors = [];
    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.push({
        field: "email",
        message: "メールアドレスは有効なメール形式で入力してください。",
      });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      errors.push({
        field: "password",
        message: "パスワードは8文字以上で入力してください。",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
        },
      });
    }

    if (email) {
      const existUser = await User.findOne({ where: { email } });
      if (!existUser) {
        return res.status(401).json({
          success: false,
          error: {
            message: "認証に失敗しました。メールアドレスが正しくありません。",
            code: "AUTHENTICATION_FAILED",
          },
        });
      }

      // bcrypt.compare: 平文とハッシュを比較（戻り値: true/false）
      const isPasswordVaild = await bcrypt.compare(
        password,
        existUser.toJSON().password as string
      );

      if (isPasswordVaild) {
        const jwtSecret = (process.env.JWT_SECRET ||
          "dev_secret_key_12345") as string;
        const userJson = existUser.toJSON();

        const jwtPayload = {
          username: userJson.username,
          email: userJson.email,
          id: userJson.id,
        };

        const token = jwt.sign(jwtPayload, jwtSecret, {
          expiresIn: "30d",
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
            message: "認証に失敗しました。パスワードが一致しません。",
            code: "AUTHENTICATION_FAILED",
          },
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: "サーバーエラーが発生しました。",
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
});

export default router;
