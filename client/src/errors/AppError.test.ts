import { describe, expect, it } from "vitest";
import { ApiHttpError, AppError, createUnknownAppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

describe("AppError", () => {
  it("メッセージとコードを保持する", () => {
    const err = new AppError(ERROR_CODES.VALIDATION_ERROR, "bad", 400);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AppError");
    expect(err.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("bad");
  });

  it("ApiHttpError が statusCode とデフォルトメッセージを設定する", () => {
    const err = new ApiHttpError(500);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiHttpError");
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("HTTP 500");
  });

  it("createUnknownAppError が UNKNOWN コードを返す", () => {
    const err = createUnknownAppError("something");
    expect(err.errorCode).toBe(ERROR_CODES.UNKNOWN);
    expect(err.message).toBe("something");
  });
});
