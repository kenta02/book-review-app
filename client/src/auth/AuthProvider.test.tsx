import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { ApiHttpError, AppError } from "../errors/AppError";
import { ERROR_CODES } from "../errors/errorCodes";
import { AuthProvider } from "./AuthProvider";
import { getToken, setToken } from "./tokenStorage";
import { useAuth } from "./useAuth";
import type { AuthContextValue } from "./authContext";
import type { AuthUser } from "../types";

const user: AuthUser = {
  id: 1,
  username: "john_doe",
  email: "john@example.com",
  role: "user",
};

/** useAuth の値をテストから触れるようにする小さな表示用コンポーネント */
function Probe({ onValue }: { onValue: (v: AuthContextValue) => void }) {
  const value = useAuth();
  onValue(value);
  return <p data-testid="status">{value.status}</p>;
}

function setup() {
  let latest!: AuthContextValue;
  render(
    <AuthProvider>
      <Probe onValue={(v) => (latest = v)} />
    </AuthProvider>,
  );
  return () => latest;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("トークンが無ければ未ログイン", () => {
    setup();
    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("保存済みトークンが有効ならログイン状態を復元する", async () => {
    setToken("t");
    vi.spyOn(apiClient, "getMe").mockResolvedValue({ data: { user } });
    const get = setup();

    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(get().user).toEqual(user);
  });

  it("401 ならトークンを破棄して未ログインにする", async () => {
    setToken("expired");
    vi.spyOn(apiClient, "getMe").mockRejectedValue(
      new ApiHttpError(401, "Unauthorized"),
    );
    setup();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    expect(getToken()).toBeNull();
  });

  it("通信エラーではトークンを残す", async () => {
    setToken("keep");
    vi.spyOn(apiClient, "getMe").mockRejectedValue(new TypeError("offline"));
    setup();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    expect(getToken()).toBe("keep");
  });

  it("login 成功でトークン保存とログイン状態になり、logout で破棄される", async () => {
    vi.spyOn(apiClient, "login").mockResolvedValue({
      data: { user, token: "new-token" },
    });
    const get = setup();

    await act(async () => {
      await get().login({ email: user.email, password: "password123" });
    });
    expect(getToken()).toBe("new-token");
    expect(get().status).toBe("authenticated");
    expect(get().user).toEqual(user);

    act(() => get().logout());
    expect(getToken()).toBeNull();
    expect(get().status).toBe("unauthenticated");
    expect(get().user).toBeNull();
  });

  it("login 失敗は AppError として投げられ、状態は変わらない", async () => {
    vi.spyOn(apiClient, "login").mockRejectedValue(
      new ApiHttpError(401, "Unauthorized"),
    );
    const get = setup();

    const error = await get()
      .login({ email: user.email, password: "wrong-pass" })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
    expect(get().status).toBe("unauthenticated");
    expect(getToken()).toBeNull();
  });

  it("register 成功でログイン状態になる", async () => {
    vi.spyOn(apiClient, "register").mockResolvedValue({
      data: { user, token: "reg-token" },
    });
    const get = setup();

    await act(async () => {
      await get().register({
        username: user.username,
        email: user.email,
        password: "password123",
      });
    });
    expect(getToken()).toBe("reg-token");
    expect(get().status).toBe("authenticated");
  });

  it("AuthProvider の外で useAuth を呼ぶとエラー", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe onValue={() => {}} />)).toThrow(/AuthProvider/);
  });
});
