import type { ApiResponse, User } from "../types";

const mockUsers: Record<number, User> = {
  1: {
    id: 1,
    username: "john_doe",
    email: "LXu2R@example.com",
    profileImageUrl: "/images/john_doe.jpg",
    bio: "本が大好き",
    createdAt: "2022-01-01T00:00:00.000Z",
  },
  2: {
    id: 2,
    username: "jane_smith",
    email: "f8TlP@example.com",
    profileImageUrl: "/images/jane_smith.jpg",
    bio: "ミステリー小説好き",
    createdAt: "2022-02-01T00:00:00.000Z",
  },
};

// ユーザーのAPIのモック
export const mockUserApi = {
  async getUserById(userId: number): Promise<ApiResponse<User>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500msの遅延をシミュレート

    // mockUsersから該当ユーザーを取得
    const user = mockUsers[userId];

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    return {
      data: user,
    };
  },
};
