import type { User } from "../../types";

type Props = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

export function ProfileCard({ user, loading, error }: Props) {
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
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
