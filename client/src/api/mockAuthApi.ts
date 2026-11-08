import type {
  ApiResponse,
  AuthResult,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "../types";
import { ApiHttpError } from "../errors/AppError";
import { waitWithAbort } from "./waitWithAbort";

// モック用のユーザー（パスワードは平文。モック専用でサーバーには送らない）
type MockAccount = AuthUser & { password: string };

const mockAccounts: MockAccount[] = [
  {
    id: 1,
    username: "john_doe",
    email: "john@example.com",
    password: "password123",
  },
];

/** モックのトークンは `mock-token-<userId>` 形式 */
const TOKEN_PREFIX = "mock-token-";

/** パスワードを除いた公開用ユーザーに変換する */
function toAuthUser({ id, username, email }: MockAccount): AuthUser {
  return { id, username, email };
}

/**
 * 認証 API のモック。サーバーの /api/auth/* と同じステータスで失敗を返す。
 * - 登録: メール重複で 409
 * - ログイン: メール不明・パスワード誤りで 401
 * - 自分の情報: トークン不正で 401
 * @example
 * const { data } = await mockAuthApi.login({ email: "john@example.com", password: "password123" });
 * data.token; // "mock-token-1"
 */
export const mockAuthApi = {
  async register(
    body: RegisterRequest,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<AuthResult>> {
    await waitWithAbort(300, abortSignal);

    if (mockAccounts.some((account) => account.email === body.email)) {
      throw new ApiHttpError(409, "Email already registered");
    }

    const account: MockAccount = {
      id: mockAccounts.length + 1,
      username: body.username,
      email: body.email,
      password: body.password,
    };
    mockAccounts.push(account);

    return {
      data: {
        user: toAuthUser(account),
        token: `${TOKEN_PREFIX}${account.id}`,
      },
    };
  },

  async login(
    body: LoginRequest,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<AuthResult>> {
    await waitWithAbort(300, abortSignal);

    const account = mockAccounts.find(
      (item) => item.email === body.email && item.password === body.password,
    );
    if (!account) {
      throw new ApiHttpError(401, "Invalid email or password");
    }

    return {
      data: {
        user: toAuthUser(account),
        token: `${TOKEN_PREFIX}${account.id}`,
      },
    };
  },

  async getMe(
    token: string | null,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<{ user: AuthUser }>> {
    await waitWithAbort(200, abortSignal);

    const userId = token?.startsWith(TOKEN_PREFIX)
      ? Number(token.slice(TOKEN_PREFIX.length))
      : NaN;
    const account = mockAccounts.find((item) => item.id === userId);
    if (!account) {
      throw new ApiHttpError(401, "Unauthorized");
    }

    return { data: { user: toAuthUser(account) } };
  },
};
