import type { ApiResponse, User } from "../types";
import { mockUserApi } from "./mockUserApi";

// VITE_USE_MOCK=true でモック API、false で実 API を使用
const VITE_USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const apiClient = {
  /**
   * ユーザー情報を ID から取得
   * @param userId - ユーザー ID
   * @returns ユーザー情報
   */
  getUserById: async (userId: number): Promise<ApiResponse<User>> => {
    if (VITE_USE_MOCK) {
      return await mockUserApi.getUserById(userId);
    } else {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error(`ユーザー${userId}の情報の取得に失敗しました。`);
      }

      // レスポンス形式が { data: User } または User の両パターンに対応
      const payload = await response.json();
      const user = payload?.data ?? payload;

      return { data: user as User };
    }
  },
};
