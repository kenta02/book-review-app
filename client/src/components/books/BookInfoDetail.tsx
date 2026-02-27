import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Book } from "../../types";
import { apiClient } from "../../api/apiClient";

export function BookInfoDetail() {
  // ダミーデータ
  const { bookId } = useParams<{ bookId: string }>();

  // 本来はAPIからデータを取得するが、ここではダミーデータを使用
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ダミーデータのセット
  useEffect(() => {
    if (bookId) {
      setLoading(true);
      apiClient
        .getBookById(parseInt(bookId))
        .then((response) => {
          setBook(response.data);
          setLoading(false);
        })
        .catch((error) => {
          setError(error.message);
          setLoading(false);
        });
    }
  }, [bookId]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-8">
      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : book ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 本のカバー画像 */}
          <div className="flex justify-center md:justify-start">
            <div className="w-48 h-64 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-white text-center text-sm px-4">
                {book?.title || "No Image Available"}
              </span>
            </div>
          </div>

          {/* 本の情報 */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {book?.title || "No Title Available"}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {book?.author || "No Author Available"}
                </p>
              </div>
              <button className="text-red-500 hover:text-red-600">
                <span className="text-2xl">♡</span>
              </button>
            </div>

            {/* 評価 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  5.0
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  (2件のレビュー)
                </span>
              </div>
            </div>

            {/* メタ情報 */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  出版年
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {book?.publishYear ? `${book.publishYear}年` : "出版年不明"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  ISBN
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {book?.isbn || "ISBN不明"}
                </p>
              </div>
            </div>

            {/* 概要 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                概要
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {book?.summary || "概要がありません。"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          表示する本がありません。
        </p>
      )}
    </div>
  );
}
