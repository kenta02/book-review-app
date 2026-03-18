import { ERROR_CODES, type ErrorCode } from "./errorCodes";

export class AppError extends Error {
  readonly errorCode: ErrorCode;
  readonly statusCode: number | undefined;

  constructor(errorCode: ErrorCode, message?: string, statusCode?: number) {
    super(message ?? errorCode);
    this.name = "AppError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}

/**
 * API クライアント層でのみ使用する HTTP エラー型。
 * UI 層には直接渡さず、必ず normalizeError を経由して AppError に変換すること。
 */
export class ApiHttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message?: string) {
    super(message ?? `HTTP ${statusCode}`);
    this.name = "ApiHttpError";
    this.statusCode = statusCode;
  }
}

export function createUnknownAppError(message?: string): AppError {
  return new AppError(ERROR_CODES.UNKNOWN, message);
}
