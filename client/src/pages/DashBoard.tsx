import { useState } from "react";
import { MainLayout } from "../components/layouts/MainLayout";
import { BookCard } from "../components/BookCard";
import { useBooks } from "../hooks/useBooks";

export function DashboardPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // hooksからAPIを呼び出して書籍データを取得するコードはここに追加します。
  // 例: const { books, loading, error } = useBooks();
  const { books, loading, error } = useBooks();

  // ローディング中、エラー中は早期リターンする
  if (loading) {
    return <MainLayout>Loading...</MainLayout>;
  }

  if (error) {
    return <MainLayout>Error: {error}</MainLayout>;
  }

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            書籍ダッシュボード
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            ここでは書籍の管理や検索ができます。
          </p>
        </div>
        <button className="py-2 px-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded font-semibold text-sm hover:from-purple-600 hover:to-pink-600 active:scale-95 transition whitespace-nowrap">
          + 書籍を追加
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center flex-wrap">
          <input
            type="text"
            placeholder="書籍名、著者名、ISBNで検索..."
            className="flex-1 min-w-[250px] py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-slate-700 rounded focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
          />
          <select className="py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400">
            <option>評価順</option>
            <option>最新順</option>
            <option>人気順</option>
          </select>
          <button
            onClick={toggleFilter}
            className="py-2 px-5 border-2 border-purple-500 text-purple-600 dark:text-purple-400 rounded font-semibold text-sm hover:bg-purple-500 hover:text-white active:scale-95 transition whitespace-nowrap"
          >
            ⚙️ フィルター
          </button>
        </div>

        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-slate-700">
            <label className="text-gray-700 dark:text-gray-400 mr-2">
              出版年
            </label>
            <select className="py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400">
              <option>全ての年</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 overflow-y-auto">
        {/* <BookCard/> */}

        {/* map形式でデータ分取得したデータを表示する */}

        {books.map((book) => (
          <BookCard
            key={book.id}
            title={book.title}
            author={book.author}
            ratingDisplay={"4.5"} // ここは仮の値です。実際にはAPIから取得した評価を表示してください。
            summary={book.summary}
            ISBN={book.ISBN}
            publicationYear={book.publicationYear}
            bookId={book.id}
          />
        ))}
      </div>
    </MainLayout>
  );
}
