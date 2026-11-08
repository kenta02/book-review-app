import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TOKEN_STORAGE_KEY,
  clearToken,
  getToken,
  setToken,
} from "./tokenStorage";

describe("tokenStorage", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("保存したトークンを取得できる", () => {
    setToken("abc");
    expect(getToken()).toBe("abc");
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe("abc");
  });

  it("未保存なら null を返す", () => {
    expect(getToken()).toBeNull();
  });

  it("clearToken で削除される", () => {
    setToken("abc");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("sessionStorage が例外を投げても落ちない", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(getToken()).toBeNull();
    expect(() => setToken("abc")).not.toThrow();
    expect(() => clearToken()).not.toThrow();
  });
});
