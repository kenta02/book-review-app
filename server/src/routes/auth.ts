import express, { Request, Response } from "express";
import User from "../models/Users";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// POST /api/auth/register - ユーザー登録エンドポイント

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    // リクエストボディからユーザー登録に必要な情報を抽出
    const { username, email, password } = req.body;
    console.log("Received registration data:", req.body);

    // 入力バリデーション: username は 3~150 文字
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

    // 入力バリデーション: email は有効なメール形式
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
    // 入力バリデーション: passwordは8文字以上
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

    // 重複チェック: usernameが既に存在するか確認
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

    // 重複チェック: emailが既に存在するか確認
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

    // パスワードをbcryptでハッシュ化（ソルトラウンド: 10）
    const hashedPassword = await bcrypt.hash(password, 10);

    // DBに新規ユーザーを保存
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // JWT生成用にSequelizeモデルをプレーンオブジェクトに変換
    const userJson = newUser.toJSON();

    // 環境変数からJWTシークレットを取得（デフォルト値付き）
    const jwtSecret = (process.env.JWT_SECRET ||
      "dev_secret_key_12345") as string;

    const jwtPayload = {
      username: userJson.username,
      email: userJson.email,
      id: userJson.id,
    };

    const token = jwt.sign(jwtPayload, jwtSecret, {
      expiresIn: "30d",
    });

    // レスポンス: ユーザー情報とJWTトークンを詳細で返す
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
    // サーバーエラーを500ステータスで返す
    res.status(500).json({
      success: false,
      error: {
        message: "サーバーエラーが発生しました。",
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
});

// routerをエクスポート
export default router;
