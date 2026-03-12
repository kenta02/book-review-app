import { Request } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ParseResult, ValidationError } from './review.validator';

// Sonar 対応: 複雑な入れ子量指定子を避けた単純なメール形式チェック。
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // NOSONAR

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

/**
 * ユーザー登録リクエストを検証し、service に渡せる型へ正規化する。
 *
 * @param req - Express Request
 * @returns 検証結果
 */
export function validateRegister(req: Request): ParseResult<RegisterPayload> {
  const body = (req.body ?? {}) as Partial<RegisterPayload>;
  const { username, email, password } = body;
  const usernameStr = typeof username === 'string' ? username : '';
  const emailStr = typeof email === 'string' ? email : '';
  const passwordStr = typeof password === 'string' ? password : '';
  const errors: ValidationError[] = [];

  if (!usernameStr || usernameStr.length < 2 || usernameStr.length > 150) {
    errors.push({ field: 'username', message: ERROR_MESSAGES.USERNAME_LENGTH });
  }

  if (!emailStr || emailStr.length > 320 || !EMAIL_REGEX.test(emailStr)) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_FORMAT });
  }

  if (!passwordStr || passwordStr.length < 8) {
    errors.push({ field: 'password', message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      username: usernameStr,
      email: emailStr,
      password: passwordStr,
    },
  };
}

/**
 * ログインリクエストを検証し、service に渡せる型へ正規化する。
 *
 * @param req - Express Request
 * @returns 検証結果
 */
export function validateLogin(req: Request): ParseResult<LoginPayload> {
  const body = (req.body ?? {}) as Partial<LoginPayload>;
  const { email, password } = body;
  const emailStr = typeof email === 'string' ? email : '';
  const passwordStr = typeof password === 'string' ? password : '';
  const errors: ValidationError[] = [];

  if (!emailStr || emailStr.length > 320 || !EMAIL_REGEX.test(emailStr)) {
    errors.push({ field: 'email', message: ERROR_MESSAGES.EMAIL_FORMAT });
  }

  if (!passwordStr || passwordStr.length < 8) {
    errors.push({ field: 'password', message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      email: emailStr,
      password: passwordStr,
    },
  };
}
