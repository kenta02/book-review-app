import { describe, expect, it } from "vitest";
import { ApiHttpError } from "../errors/AppError";
import { mockAuthApi } from "./mockAuthApi";

describe("mockAuthApi", () => {
  it("正しい認証情報でログインできる", async () => {
    const { data } = await mockAuthApi.login({
      email: "john@example.com",
      password: "password123",
    });
    expect(data.token).toBe("mock-token-1");
    expect(data.user).toEqual({
      id: 1,
      username: "john_doe",
      email: "john@example.com",
    });
  });

  it("パスワード誤りは 401", async () => {
    await expect(
      mockAuthApi.login({ email: "john@example.com", password: "wrong-pass" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("新規登録後に同じメールで登録すると 409", async () => {
    const body = {
      username: "new_user",
      email: "new@example.com",
      password: "password123",
    };
    const { data } = await mockAuthApi.register(body);
    expect(data.user.email).toBe("new@example.com");
    expect(data.user).not.toHaveProperty("password");

    await expect(mockAuthApi.register(body)).rejects.toBeInstanceOf(
      ApiHttpError,
    );
  });

  it("有効なトークンで自分の情報を取得でき、不正なら 401", async () => {
    const { data } = await mockAuthApi.getMe("mock-token-1");
    expect(data.user.username).toBe("john_doe");

    await expect(mockAuthApi.getMe("bad")).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(mockAuthApi.getMe(null)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
