import { ApiHttpError, AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

function mapStatusToErrorCode(statusCode: number) {
  if (statusCode === 400 || statusCode === 422) {
    return ERROR_CODES.VALIDATION_ERROR;
  }

  if (statusCode === 401) {
    return ERROR_CODES.UNAUTHORIZED;
  }

  if (statusCode === 403) {
    return ERROR_CODES.FORBIDDEN;
  }

  if (statusCode === 404) {
    return ERROR_CODES.NOT_FOUND;
  }

  if (statusCode === 409) {
    return ERROR_CODES.VALIDATION_ERROR;
  }

  if (statusCode >= 500) {
    return ERROR_CODES.SERVER_ERROR;
  }

  return ERROR_CODES.UNKNOWN;
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ApiHttpError) {
    return new AppError(
      mapStatusToErrorCode(error.statusCode),
      error.message,
      error.statusCode,
    );
  }

  if (error instanceof TypeError) {
    return new AppError(ERROR_CODES.NETWORK_ERROR, error.message);
  }

  if (error instanceof Error) {
    return new AppError(ERROR_CODES.UNKNOWN, error.message);
  }

  return new AppError(ERROR_CODES.UNKNOWN);
}
