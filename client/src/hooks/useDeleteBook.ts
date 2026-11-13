import { useState } from "react";
import { apiClient } from "../api/apiClient";
import { getBookDeleteErrorMessage } from "../components/books/bookErrorMessage";
import { normalizeError } from "../errors/normalizeError";

/**
 * 書籍1冊の削除フロー（確認 → 実行 → 成功/失敗）の状態を管理するフック。
 * 詳細画面とカードで同じ流れを使うため、状態遷移をここにまとめている。
 * 削除に成功したときだけ onDeleted を呼ぶ（画面遷移や一覧の再取得は呼び出し側の責務）。
 * @param bookId - 削除する書籍の ID
 * @param onDeleted - 削除に成功した後に呼ばれる（例: ダッシュボードへ戻る / 一覧を再取得する）
 * @returns 状態（isConfirming / deleting / error）と操作（requestDelete / cancel / confirmDelete）
 * @example
 * const { isConfirming, deleting, error, requestDelete, cancel, confirmDelete } =
 *   useDeleteBook(book.id, () => navigate("/dashboard"));
 */
export function useDeleteBook(
  bookId: number,
  onDeleted: () => Promise<void> | void,
) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 「削除」が押されたとき: 前回のエラーを消して、確認を表示する */
  const requestDelete = () => {
    setError(null);
    setIsConfirming(true);
  };

  /** 確認・エラー表示を閉じる（削除中は呼ばれない想定） */
  const cancel = () => {
    setError(null);
    setIsConfirming(false);
  };

  /** 削除を実行する。失敗したらエラーを表示し、成功したら onDeleted を呼ぶ */
  const confirmDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.deleteBook(bookId);
    } catch (err) {
      setError(getBookDeleteErrorMessage(normalizeError(err)));
      setDeleting(false);
      setIsConfirming(false);
      return;
    }
    setDeleting(false);
    setIsConfirming(false);
    await onDeleted();
  };

  return {
    isConfirming,
    deleting,
    error,
    requestDelete,
    cancel,
    confirmDelete,
  };
}
