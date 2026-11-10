import { describe, expect, it } from "vitest";
import { validateLoginForm, validateRegisterForm } from "./validateAuthForm";

describe("validateLoginForm", () => {
  it("正しい入力ならエラーなし", () => {
    expect(
      validateLoginForm({ email: "a@example.com", password: "password123" }),
    ).toEqual({});
  });

  it("メール形式とパスワード長のエラーを返す", () => {
    const errors = validateLoginForm({ email: "abc", password: "short" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it("パスワードは 8 文字ちょうどなら OK", () => {
    expect(
      validateLoginForm({ email: "a@example.com", password: "12345678" }),
    ).toEqual({});
  });
});

describe("validateRegisterForm", () => {
  const valid = {
    username: "john",
    email: "john@example.com",
    password: "password123",
  };

  it("正しい入力ならエラーなし", () => {
    expect(validateRegisterForm(valid)).toEqual({});
  });

  it("ユーザー名は 2 文字以上", () => {
    expect(
      validateRegisterForm({ ...valid, username: "a" }).username,
    ).toBeDefined();
    expect(validateRegisterForm({ ...valid, username: "ab" })).toEqual({});
  });

  it("ユーザー名は trim せず、渡された値の長さで検証する（サーバーと同じ）", () => {
    // 空白込みで 3 文字なので通る。空白除去は呼び出し側の責務
    expect(validateRegisterForm({ ...valid, username: " a " })).toEqual({});
  });

  it("ユーザー名は 150 文字まで", () => {
    expect(
      validateRegisterForm({ ...valid, username: "a".repeat(151) }).username,
    ).toBeDefined();
    expect(
      validateRegisterForm({ ...valid, username: "a".repeat(150) }),
    ).toEqual({});
  });
});
