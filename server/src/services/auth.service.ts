import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UniqueConstraintError, ValidationErrorItem } from 'sequelize';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as userRepository from '../repositories/user.repository';
import type { LoginPayload, RegisterPayload } from '../validators/auth.validator';

export type AuthUserDto = {
  id: number;
  username: string;
  email: string;
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

function hasUniqueConstraintPath(error: unknown, targetPath: 'username' | 'email'): boolean {
  if (error instanceof UniqueConstraintError) {
    return error.errors.some((item: ValidationErrorItem) => item.path === targetPath);
  }

  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    name?: string;
    errors?: Array<{ path?: string }>;
    fields?: Record<string, unknown>;
    message?: string;
    sqlMessage?: string;
    original?: { sqlMessage?: string };
    parent?: { sqlMessage?: string };
  };

  if (candidate.name !== 'SequelizeUniqueConstraintError') {
    return false;
  }

  const hasErrorPath = (candidate.errors || []).some((item) => item.path === targetPath);
  if (hasErrorPath) {
    return true;
  }

  if (candidate.fields && targetPath in candidate.fields) {
    return true;
  }

  const raw = [candidate.message, candidate.sqlMessage, candidate.original?.sqlMessage, candidate.parent?.sqlMessage]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return raw.includes(targetPath);
}

function toAuthUserDto(model: userRepository.UserInstance): AuthUserDto {
  const json = model.toJSON() as { id: number; username: string; email: string };
  return {
    id: json.id,
    username: json.username,
    email: json.email,
  };
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
    if (hasUniqueConstraintPath(error, 'username')) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_USERNAME);
    }

    if (hasUniqueConstraintPath(error, 'email')) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_EMAIL);
    }

    throw error;
  }

  const user = toAuthUserDto(createdUser);
  const token = jwt.sign(user, getJwtSecret(), { expiresIn: '30d' });

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
  const token = jwt.sign(user, getJwtSecret(), { expiresIn: '30d' });

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
