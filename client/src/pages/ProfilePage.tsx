import { useEffect, useState } from "react";
import { ProfileCard } from "../components/user/ProfileCard";
import type { ApiResponse, User } from "../types";
import { apiClient } from "../api/apiClient";
import type { ErrorCode } from "../errors/errorCodes";
import { normalizeError } from "../errors/normalizeError";

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // アンマウント後の setState を防ぐフラグ
    let mounted = true;

    const fetchUser = async () => {
      setLoading(true);

      try {
        const response: ApiResponse<User> = await apiClient.getUserById(1);
        if (mounted) {
          setUser(response.data);
        }
      } catch (error) {
        if (mounted) {
          setErrorCode(normalizeError(error).errorCode);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  return <ProfileCard user={user} loading={loading} errorCode={errorCode} />;
}
