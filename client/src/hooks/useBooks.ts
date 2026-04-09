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

  // データ取得完了（成功/失敗）の判定に使うフラグ
  // 初期表示時は未取得とみなし、0件表示のちらつきを防ぐ
  const [isFetched, setIsFetched] = useState<boolean>(false);

  // コンポーネントがアンマウントされたかどうかを監視
  // unmounted状態で setState を呼ばないようにするために使用
  const isMountedRef = useRef(true);
  // 最後に開始したリクエスト番号を保持し、古いレスポンスの上書きを防ぐ
  const currentRequestIdRef = useRef(0);

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

      const requestId = currentRequestIdRef.current + 1;
      currentRequestIdRef.current = requestId;

      // 最新リクエストの開始時点でローディング表示に切り替える。
      setLoading(true);
      try {
        // 実またはモック API 呼び出し。query には検索・絞り込み条件が含まれる。
        const res = await apiClient.searchBooks(query, signal);
        logger.log("API Response:", res);

        // 単純にアンマウントされていたら後続ステート更新しない
        if (
          !isMountedRef.current ||
          currentRequestIdRef.current !== requestId
        ) {
          // 自分より新しいリクエストが開始済みなら、この結果は破棄する。
          return;
        }

        if (Array.isArray(res?.data?.books)) {
          logger.log("Books data:", res.data.books);

          // pagination があれば設定し、なければ警告
          if (res.data.pagination) {
            logger.log("Pagination data:", res.data.pagination);
            setPagination(res.data.pagination);
          } else {
            logger.warn("Pagination data is missing in the response");
            setPagination(null);
          }

          // 正常なケース：エラー解除して書籍データをセット
          setErrorCode(null);
          setBooks(res.data.books);
          setIsFetched(true); // 取得済みフラグを true に
        } else {
          // API のフォーマットが想定と異なる場合は例外にして catch へ飛ばす
          throw createUnknownAppError("Unexpected response payload");
        }
      } catch (e) {
        if (
          !isMountedRef.current ||
          currentRequestIdRef.current !== requestId
        ) {
          // 古いリクエストの失敗で最新状態を汚染しない。
          return;
        }

        // AbortController によるキャンセルはユーザー操作による中断として扱う
        if (e instanceof DOMException && e.name === "AbortError") {
          logger.warn("Fetch aborted");
          return;
        }

        // それ以外のエラーは UI に表示させるためのエラー状態を設定
        const appError = normalizeError(e);
        logger.error("Error fetching books:", appError);
        setErrorCode(appError.errorCode);

        // エラー時は一覧表示を消し、空状態とする
        setBooks([]);
        setPagination(null);

        // API 呼び出しは試行済みとしてフラグを立てる
        setIsFetched(true);
      } finally {
        if (
          isMountedRef.current &&
          currentRequestIdRef.current === requestId
        ) {
          setLoading(false);
        }
      }
    },
    [query],
  );

  const refresh = useCallback(async () => {
    // ボタンイベントなどの引数を受け取らない再取得専用関数として公開する。
    await fetchBooks();
  }, [fetchBooks]);

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

  return {
    books,
    loading,
    errorCode,
    pagination,
    refresh,
    isFetched,
  };
}
