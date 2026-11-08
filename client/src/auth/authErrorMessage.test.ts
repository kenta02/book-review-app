import { describe, expect, it } from "vitest";
import { AppError } from "../errors/AppError";
import { ERROR_CODES } from "../errors/errorCodes";
import { getAuthErrorMessage } from "./authErrorMessage";

describe("getAuthErrorMessage", () => {
  it("401 はメール・パスワードのどちらが誤りかを明かさない", () => {
    const message = getAuthErrorMessage(
      new AppError(ERROR_CODES.UNAUTHORIZED),
      "login",
    );
    expect(message).toBe("メールアドレスまたはパスワードが正しくありません");
  });

  it("登録の VALIDATION_ERROR は重複を示すメッセージ", () => {
    const message = getAuthErrorMessage(
      new AppError(ERROR_CODES.VALIDATION_ERROR),
      "register",
    );
    expect(message).toContain("既に登録");
  });

  it("通信エラーとサーバーエラーで別の文言", () => {
    const network = getAuthErrorMessage(
      new AppError(ERROR_CODES.NETWORK_ERROR),
      "login",
    );
    const server = getAuthErrorMessage(
      new AppError(ERROR_CODES.SERVER_ERROR),
      "login",
    );
    expect(network).toContain("通信");
    expect(server).toContain("サーバー");
  });

  it("サーバーのメッセージは画面に出さない", () => {
    const message = getAuthErrorMessage(
      new AppError(ERROR_CODES.UNKNOWN, "SQL error: secret"),
      "login",
    );
    expect(message).not.toContain("secret");
  });
});
