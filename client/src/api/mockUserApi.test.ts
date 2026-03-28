import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiHttpError } from "../errors/AppError";
import { mockUserApi } from "./mockUserApi";

describe("mockUserApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getUserById returns existing user", async () => {
    const promise = mockUserApi.getUserById(1);
    vi.advanceTimersByTime(500);

    const user = await promise;
    expect(user.data.id).toBe(1);
    expect(user.data.username).toBe("john_doe");
  });

  it("getUserById throws ApiHttpError when user not found", async () => {
    const promise = mockUserApi.getUserById(999);
    vi.advanceTimersByTime(500);

    await expect(promise).rejects.toEqual(new ApiHttpError(404, "User 999 not found"));
  });
});