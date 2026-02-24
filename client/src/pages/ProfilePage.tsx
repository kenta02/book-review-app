import { useEffect, useState } from "react";
import { ProfileCard } from "../components/user/ProfileCard";
import type { User } from "../types";
import { apiClient } from "../api/apiClient";

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // ユーザーデータ取得開始
    setLoading(true);
    // APIクライアントを呼び出してユーザーデータを取得
    apiClient
      .getUserById(1)
      .then((response: { data: User }) => {
        // 成功したら：user をセット、loading を false に
        setUser(response.data);
        setLoading(false);
      })
      .catch((err: { message: string }) => {
        // 失敗したら：error をセット、loading を false に
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return <ProfileCard user={user} loading={loading} error={error} />;
}
