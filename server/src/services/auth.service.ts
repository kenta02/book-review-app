import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as userRepository from '../repositories/user.repository';
import { isUniqueConstraintError } from '../utils/sequelizeErrors';
import type { LoginPayload, RegisterPayload } from '../validators/auth.validator';

export type AuthUserDto = {
  id: number;
  username: string;
  email: string;
  /** 権限（'user' | 'admin'）。クライアントが管理者向けの操作を出し分けるために返す */
  role: string;
};

export type AuthSuccessDto = {
  user: AuthUserDto;
  token: string;
};

function getJwtSecret(): string {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error('JWT_SECRET is required');
  }
  return secretKey;
}

function toAuthUserDto(model: userRepository.UserInstance): AuthUserDto {
  const json = model.toJSON() as { id: number; username: string; email: string; role: string }; // NOSONAR
  return {
    id: json.id,
    username: json.username,
    email: json.email,
    role: json.role,
  };
}

/**
 * 認証トークン（JWT）を発行する。
 * role はトークンに含めない。権限は認証ミドルウェアが毎回 DB の最新値を読むため、
 * トークンに入れると権限変更後も古い値が残ってしまう。
 *
 * @param user - トークンを発行するユーザー
 * @returns 署名済みの JWT（有効期限 30 日）
 */
function issueToken(user: AuthUserDto): string {
  const payload = { id: user.id, username: user.username, email: user.email };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

/**
 * 新規ユーザーを作成し、認証トークンを返す。
 *
 * @param payload - 登録入力
 * @returns user と token
 */
export async function register(payload: RegisterPayload): Promise<AuthSuccessDto> {
  const { username, email, password } = payload;

  const [existingByUsername, existingByEmail] = await Promise.all([
    userRepository.findUserByUsername(username),
    userRepository.findUserByEmail(email),
  ]);

  if (existingByUsername) {
    throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_USERNAME);
  }

  if (existingByEmail) {
    throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_EMAIL);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let createdUser: userRepository.UserInstance;
  try {
    createdUser = await userRepository.createUser({
      username,
      email,
      password: hashedPassword,
    });
  } catch (error) {
    if (isUniqueConstraintError(error, ['username'])) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_USERNAME);
    }

    if (isUniqueConstraintError(error, ['email'])) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_EMAIL);
    }

    throw error;
  }

  const user = toAuthUserDto(createdUser);
  const token = issueToken(user);

  return { user, token };
}

/**
 * メールアドレスとパスワードで認証し、認証トークンを返す。
 *
 * @param payload - ログイン入力
 * @returns user と token
 */
export async function login(payload: LoginPayload): Promise<AuthSuccessDto> {
  const { email, password } = payload;

  const existingUser = await userRepository.findUserByEmail(email);
  if (!existingUser) {
    throw new ApiError(401, 'AUTHENTICATION_FAILED', ERROR_MESSAGES.AUTHENTICATION_FAILED);
  }

  const userJson = existingUser.toJSON() as {
    password?: string;
  };

  const isPasswordValid = await bcrypt.compare(password, userJson.password || '');
  if (!isPasswordValid) {
    throw new ApiError(401, 'AUTHENTICATION_FAILED', ERROR_MESSAGES.AUTHENTICATION_FAILED);
  }

  const user = toAuthUserDto(existingUser);
  const token = issueToken(user);

  return { user, token };
}

/**
 * 認証済みユーザー自身のプロフィールを返す。
 *
 * @param userId - JWT 由来のユーザー ID
 * @returns ユーザー情報
 */
export async function getMyProfile(userId: number): Promise<{ user: AuthUserDto }> {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return {
    user: toAuthUserDto(user),
  };
}
