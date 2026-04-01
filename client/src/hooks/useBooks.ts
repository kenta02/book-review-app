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
 * @param query - 検索・フィルタ・ソート条件（未指定時は全書籍一覧）
 * @returns {useBooksResult} books（書籍配列）/ pagination（ページネーション）/ loading（取得中フラグ）/ errorCode（エラーコード）/ refresh（再取得関数）
 */
export function useBooks(query?: BookListQuery): useBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // マウント状態を保持する（アンマウント時に state 更新を防ぐため）
  const isMountedRef = useRef(true);

  /**
   * 書籍データを取得し、状態を更新するコア関数
   * @param signal - AbortController から渡されるキャンセルシグナル
   */
  const fetchBooks = useCallback(
    async (signal?: AbortSignal) => {
      // コンポーネントがアンマウント済みなら処理を中断
      if (!isMountedRef.current) {
        return;
      }

      setLoading(true);
      try {
        // 実またはモック API 呼び出し。query には検索・絞り込み条件が含まれる。
        const res = await apiClient.searchBooks(query, signal);
        logger.log("API Response:", res);

        // 単純にアンマウントされていたら後続ステート更新しない
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

        // AbortController によるキャンセルはエラー扱いしない
        if (e instanceof DOMException && e.name === "AbortError") {
          logger.warn("Fetch aborted");
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
      }
    },
    [query],
  );

  // コンポーネントのマウント時とクエリの変更時に書籍データを取得する
  useEffect(() => {
    // APIリクエストをキャンセルするためのコントローラー
    const controller = new AbortController();
    // マウント状態を更新
    isMountedRef.current = true;

    // 書籍データを取得する。引数としてAbortSignalを渡すことで、クリーンアップ時にリクエストをキャンセルできるようにする。
    fetchBooks(controller.signal);

    // クリーンアップ関数でマウント状態を更新し、前リクエストを中断する
    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, [fetchBooks]);

  return { books, loading, errorCode, pagination, refresh: fetchBooks };
}
