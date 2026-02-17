import { ProfileCard } from "../components/user/ProfileCard";

export function ProfilePage() {
  const user = {
    username: "JohnDoe",
    email: "sam@example.com",
  };
  return <ProfileCard user={user} />;
}
