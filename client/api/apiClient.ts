import type { ApiResponse, User } from "../types";
import { mockUserApi } from "./mockUserApi";
const VITE_USE_MOCK = import.meta.env.VITE_USE_MOCK === "false";

export const apiClient = {
  getUserById: async (userId: number): Promise<ApiResponse<User>> => {
    // 環境変数で切り替え
    if (VITE_USE_MOCK) {
      // モックAPIを呼び出す
      console.log("モックAPIを使用してユーザー情報を取得", userId);
      return await mockUserApi.getUserById(userId);
    }
    throw new Error("実際のAPIクライアントはまだ実装されていません");
  },
};
