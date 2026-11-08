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

  it("ユーザー名は前後の空白を除いて 2 文字以上", () => {
    expect(
      validateRegisterForm({ ...valid, username: " a " }).username,
    ).toBeDefined();
    expect(validateRegisterForm({ ...valid, username: " ab " })).toEqual({});
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
