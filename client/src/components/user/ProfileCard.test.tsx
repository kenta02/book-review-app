import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileCard } from "./ProfileCard";
import { ERROR_CODES } from "../../errors/errorCodes";

describe("ProfileCard", () => {
  it("displays loading state", () => {
    render(<ProfileCard user={null} loading={true} errorCode={null} />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it("displays error state", () => {
    render(
      <ProfileCard
        user={null}
        loading={false}
        errorCode={ERROR_CODES.NOT_FOUND}
      />,
    );
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(
      screen.getByText(/ユーザー情報が見つかりませんでした。/),
    ).toBeInTheDocument();
  });

  it("displays empty when user is null and no error", () => {
    render(<ProfileCard user={null} loading={false} errorCode={null} />);
    expect(screen.getByText(/ユーザー情報がありません。/)).toBeInTheDocument();
  });

  it("displays user info when user available", () => {
    render(
      <ProfileCard
        user={{
          id: 1,
          username: "test",
          email: "t@example.com",
          profileImageUrl: "",
          bio: "",
          createdAt: "",
        }}
        loading={false}
        errorCode={null}
      />,
    );

    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("t@example.com")).toBeInTheDocument();
  });
});
