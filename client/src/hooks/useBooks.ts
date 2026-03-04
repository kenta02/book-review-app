import { useState, useEffect } from "react";
import { apiClient } from "../api/apiClient";
import { logger } from "../utils/logger";
import type { Book } from "../types";

/**
 * 書籍一覧取得用のカスタムフック
 * APIクライアントを呼び出して書籍データを取得し、ローディング状態やエラー状態も管理します。
 */
export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBooks = async () => {
      try {
        // APIクライアントから書籍一覧を取得する
        const res = await apiClient.getAllBooks();
        logger.log("API Response:", res);
        if (res?.data?.books) {
          // 書籍データが正常に取得できた場合、状態を更新する
          if (mounted) {
            logger.log("Books data:", res.data.books);
            setBooks(res.data.books);
          }
        } else {
          throw new Error("不正なレスポンス形式です。");
        }
      } catch (e) {
        if (mounted) {
          const errorMessage =
            e instanceof Error ? e.message : "予期せぬエラーが発生しました";
          logger.error("Error fetching books:", errorMessage);
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBooks();

    return () => {
      mounted = false;
    };
  }, []);

  return { books, loading, error };
}
