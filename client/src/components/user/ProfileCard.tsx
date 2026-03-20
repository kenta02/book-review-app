import type { User } from "../../types";
import { PROFILE_ERROR_MESSAGES } from "../../constants/messages";
import type { ErrorCode } from "../../errors/errorCodes";

type Props = Readonly<{
  user: User | null;
  loading: boolean;
  errorCode: ErrorCode | null;
}>;

export function ProfileCard({ user, loading, errorCode }: Props) {
  const errorMessage = errorCode ? PROFILE_ERROR_MESSAGES[errorCode] : null;

  if (loading) {
    return <div>Loading...</div>;
  }
  if (errorMessage) {
    return <div>Error: {errorMessage}</div>;
  }
  if (!user) {
    return <div>ユーザー情報がありません。</div>;
  }
  return (
    <div className="profile-card">
      <h2>{user?.username}</h2>
      <p>{user?.email}</p>
    </div>
  );
}
