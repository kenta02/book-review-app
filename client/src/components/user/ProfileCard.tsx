type User = {
  username: string;
  email: string;
};

type Props = {
  user: User;
};

export function ProfileCard({ user }: Props) {
  return (
    <div className="profile-card">
      <h2>{user.username}</h2>
      <p>{user.email}</p>
    </div>
  );
}
