import { useState } from "react";
import { apiClient } from "../api/apiClient";

/*
 * 書籍削除用のカスタムフック
 */
export function useDeleteBook() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   *  指定された書籍IDの書籍を削除する関数
   *  削除前に書籍が存在するか確認し、存在しない場合はエラーをスローする
   * @param bookId 削除対象の書籍ID
   */
  const deleteBook = async (bookId: number) => {
    try {
      const res = await apiClient.getBookById(bookId);

      // ローディング状態を開始し、エラー状態をリセットする
      setLoading(true);
      setError(null);

      // 書籍が存在する場合のみ削除処理を行う
      if (res?.data?.id) {
        await apiClient.deleteBook(bookId);
      } else {
        throw new Error("削除対象の書籍が見つかりませんでした。");
      }
    } catch (e) {
      // エラーハンドリング
      const errorMessage =
        e instanceof Error ? e.message : "予期せぬエラーが発生しました";
      setError(errorMessage);
    } finally {
      // 状態の更新
      setLoading(false);
    }
  };
  return { deleteBook, loading, error };
}
