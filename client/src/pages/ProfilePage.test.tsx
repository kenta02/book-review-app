import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "./ProfilePage";
import { apiClient } from "../api/apiClient";

vi.mock("../api/apiClient", () => {
  return {
    apiClient: {
      getUserById: vi.fn(),
    },
  };
});

describe("ProfilePage", () => {
  beforeEach(() => {
    (apiClient.getUserById as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it("API がユーザーを返したときユーザーデータをレンダリングする", async () => {
    (
      apiClient.getUserById as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      data: {
        id: 1,
        username: "user",
        email: "user@example.com",
        profileImageUrl: "",
        bio: "",
        createdAt: "",
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("user")).toBeInTheDocument();
    });
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("API が失敗したときエラーメッセージを表示する", async () => {
    (
      apiClient.getUserById as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("fail"));

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/ユーザー情報の取得中に/)).toBeInTheDocument();
    });
  });
});
