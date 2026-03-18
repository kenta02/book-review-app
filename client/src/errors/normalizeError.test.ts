import { describe, expect, it } from "vitest";
import { ApiHttpError, AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";
import { normalizeError } from "./normalizeError";

describe("normalizeError", () => {
  it("AppError をそのまま返す", () => {
    const appError = new AppError(ERROR_CODES.UNKNOWN, "test");
    const result = normalizeError(appError);
    expect(result).toBe(appError);
  });

  it("401 を UNAUTHORIZED に正規化", () => {
    const httpError = new ApiHttpError(401, "Unauthorized");
    const result = normalizeError(httpError);
    expect(result.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
    expect(result.statusCode).toBe(401);
  });

  it("403 を FORBIDDEN に正規化", () => {
    const httpError = new ApiHttpError(403, "Forbidden");
    const result = normalizeError(httpError);
    expect(result.errorCode).toBe(ERROR_CODES.FORBIDDEN);
    expect(result.statusCode).toBe(403);
  });

  it("404 を NOT_FOUND に正規化", () => {
    const httpError = new ApiHttpError(404, "Not Found");
    const result = normalizeError(httpError);
    expect(result.errorCode).toBe(ERROR_CODES.NOT_FOUND);
    expect(result.statusCode).toBe(404);
  });

  it("409 を VALIDATION_ERROR に正規化", () => {
    const httpError = new ApiHttpError(409, "Conflict");
    const result = normalizeError(httpError);
    expect(result.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(result.statusCode).toBe(409);
  });

  it("400 を VALIDATION_ERROR に正規化", () => {
    const httpError = new ApiHttpError(400, "Bad Request");
    const result = normalizeError(httpError);
    expect(result.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(result.statusCode).toBe(400);
  });

  it("422 を VALIDATION_ERROR に正規化", () => {
    const httpError = new ApiHttpError(422, "Unprocessable Entity");
    const result = normalizeError(httpError);
    expect(result.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(result.statusCode).toBe(422);
  });

  it("500系 を SERVER_ERROR に正規化", () => {
    const httpError = new ApiHttpError(500, "Internal Server Error");
    const result = normalizeError(httpError);
    expect(result.errorCode).toBe(ERROR_CODES.SERVER_ERROR);
    expect(result.statusCode).toBe(500);
  });

  it("通信失敗（TypeError）を NETWORK_ERROR に正規化", () => {
    const typeError = new TypeError("fetch failed");
    const result = normalizeError(typeError);
    expect(result.errorCode).toBe(ERROR_CODES.NETWORK_ERROR);
  });

  it("想定外の Error を UNKNOWN に正規化", () => {
    const error = new Error("unexpected");
    const result = normalizeError(error);
    expect(result.errorCode).toBe(ERROR_CODES.UNKNOWN);
  });

  it("unknown を UNKNOWN に正規化", () => {
    const result = normalizeError("unknown string");
    expect(result.errorCode).toBe(ERROR_CODES.UNKNOWN);
  });
});
