import { Request } from 'express';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ParseResult, ValidationError } from './review.validator';

export type GetUserProfileParams = {
  userId: number;
};

/**
 * ユーザープロフィール取得 API の path param を検証する。
 *
 * @param req - Express Request
 * @returns 検証結果
 */
export function validateGetUserProfile(req: Request): ParseResult<GetUserProfileParams> {
  const userId = Number(req.params.id);
  const errors: ValidationError[] = [];

  if (!Number.isInteger(userId) || userId <= 0) {
    errors.push({
      field: 'id',
      message: ERROR_MESSAGES.INVALID_USER_ID,
      code: 'INVALID_USER_ID',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { userId },
  };
}
