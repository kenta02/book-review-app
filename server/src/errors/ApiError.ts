export type ErrorDetail = { field: string; message: string };

import { ERROR_MESSAGES } from '../constants/error-messages';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: ErrorDetail[]
  ) {
    super(message);
    // Fix prototype chain for instanceof to work after transpile
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  static validation(details: ErrorDetail[]) {
    return new ApiError(400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_FAILED, details);
  }

  static notFound(code = 'NOT_FOUND', message = ERROR_MESSAGES.NOT_FOUND) {
    return new ApiError(404, code, message);
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
