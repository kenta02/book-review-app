import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../api/apiClient";
import { createUnknownAppError } from "../errors/AppError";
import type { ErrorCode } from "../errors/errorCodes";
import { normalizeError } from "../errors/normalizeError";
import { logger } from "../utils/logger";
import type { Book, BookListQuery, useBooksResult } from "../types";
import type { Pagination } from "../types/index";

/**
 * 書籍一覧取得用のカスタムフック
 * APIクライアントを呼び出して書籍データを取得し、ローディング状態やエラー状態も管理します。
 */
export function useBooks(query?: BookListQuery): useBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // マウント状態を保持する
  const isMountedRef = useRef(true);
  // 連続呼び出しで多重フェッチされるのを防ぐフラグ
  const isFetchingRef = useRef(false);

  const fetchBooks = useCallback(async () => {
    // マウントされていない、あるいは既に取得中なら処理を中断
    if (!isMountedRef.current || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await apiClient.searchBooks(query);
      logger.log("API Response:", res);

      if (!isMountedRef.current) {
        return;
      }

      if (Array.isArray(res?.data?.books)) {
        logger.log("Books data:", res.data.books);

        if (res.data.pagination) {
          logger.log("Pagination data:", res.data.pagination);
          setPagination(res.data.pagination);
        } else {
          logger.warn("Pagination data is missing in the response");
        }

        setErrorCode(null);
        setBooks(res.data.books);
      } else {
        throw createUnknownAppError("Unexpected response payload");
      }
    } catch (e) {
      if (!isMountedRef.current) {
        return;
      }
      const appError = normalizeError(e);
      logger.error("Error fetching books:", appError);
      setErrorCode(appError.errorCode);
      setBooks([]);
      setPagination(null);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [query]);

  // コンポーネントのマウント時とクエリの変更時に書籍データを取得する
  useEffect(() => {
    // マウント状態を更新
    isMountedRef.current = true;

    // 書籍データを取得する
    fetchBooks();
    // クリーンアップ関数でマウント状態を更新する
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBooks]);

  return { books, loading, errorCode, pagination, refresh: fetchBooks };
}
