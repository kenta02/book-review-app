import { MainLayout } from "../components/layouts/MainLayout";
import { BookCard } from "../components/BookCard";
import { BOOK_LIST_ERROR_MESSAGES } from "../constants/messages";
import { useBooks } from "../hooks/useBooks";

export function DashboardPage() {
  const { books, loading, errorCode } = useBooks();
  const errorMessage = errorCode ? BOOK_LIST_ERROR_MESSAGES[errorCode] : null;

  // ローディング中、エラー中は早期リターンする
  if (loading) {
    return <MainLayout>Loading...</MainLayout>;
  }

  if (errorMessage) {
    return <MainLayout>Error: {errorMessage}</MainLayout>;
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
        <button
          data-testid="add-book-button"
          className="py-2 px-5 bg-gray-900 border border-black/20 rounded font-semibold text-sm hover:bg-gray-800 active:scale-95 transition whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          + 書籍を追加
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 sm:p-6 mb-6 space-y-4">
        {/* 検索入力フィールド */}
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
          <label htmlFor="search-input" className="sr-only">
            検索
          </label>
          <input
            id="search-input"
            type="text"
            aria-label="書籍名、著者名、要約で検索"
            placeholder="書籍名、著者名、要約で検索..."
            className="w-full py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-slate-700 rounded focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {/* フィルター項目 */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label
              htmlFor="filter-rating"
              className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              評価
            </label>
            <select
              id="filter-rating"
              className="min-w-[180px] py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
            >
              <option>すべて</option>
              <option>★1以上</option>
              <option>★2以上</option>
              <option>★3以上</option>
              <option>★4以上</option>
              <option>★5のみ</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              出版年
            </span>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                inputMode="numeric"
                placeholder="From"
                aria-label="出版年 From"
                className="w-[110px] py-2 px-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-slate-700 rounded focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
              />
              <span className="text-gray-500 dark:text-gray-400">〜</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="to"
                aria-label="出版年 to"
                className="w-[110px] py-2 px-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-slate-700 rounded focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label
              htmlFor="sort-order"
              className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              並び替え
            </label>
            <select
              id="sort-order"
              className="min-w-[220px] py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
            >
              <option>評価が高い順</option>
              <option>登録日が新しい順</option>
              <option>タイトル順</option>
              <option>著者名順</option>
              <option>出版年が新しい順</option>
            </select>
          </div>
        </div>

        {/* ボタングループ（右下） */}
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            data-testid="clear-filters-button"
            className="py-2 px-4 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded font-semibold text-sm hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition whitespace-nowrap"
          >
            クリア
          </button>
          <button
            type="button"
            data-testid="search-button"
            className="py-2 px-5 bg-gray-900 border border-black/20 rounded font-semibold text-sm hover:bg-gray-800 active:scale-95 transition whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            検索
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 overflow-y-auto">
        {books.map((book) => (
          <BookCard
            key={book.id}
            title={book.title}
            author={book.author}
            ratingDisplay={"4.5"} // ここは仮の値です。実際にはAPIから取得した評価を表示します。
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
