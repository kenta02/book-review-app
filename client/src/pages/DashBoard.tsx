import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { BookCard } from "../components/BookCard";
import { BOOK_LIST_ERROR_MESSAGES } from "../constants/messages";
import { useBooks } from "../hooks/useBooks";
import type { BookListQuery } from "../types";
import {
  INITIAL_QUERY,
  buildSearchParams,
  parseQueryParams,
  parseSortOrderValue,
} from "../utils/bookListQuery";

// セレクト 1 つで sort/order の全組み合わせを表現する。
const sortOptions = [
  { value: "createdAt-desc", label: "登録日が新しい順" },
  { value: "createdAt-asc", label: "登録日が古い順" },
  { value: "rating-desc", label: "評価が高い順" },
  { value: "rating-asc", label: "評価が低い順" },
  { value: "title-asc", label: "タイトル昇順" },
  { value: "title-desc", label: "タイトル降順" },
  { value: "author-asc", label: "著者名昇順" },
  { value: "author-desc", label: "著者名降順" },
  { value: "publicationYear-desc", label: "出版年が新しい順" },
  { value: "publicationYear-asc", label: "出版年が古い順" },
] as const;

/**
 * 書籍ダッシュボード（検索・絞り込み・並び替え付きの書籍一覧）。
 *
 * - 適用済みの検索条件（appliedQuery）は URL を唯一の情報源として導出する。
 *   リロード・共有・戻る/進むでも同じ条件と結果になる。
 * - 入力中の条件（draftQuery）は「検索」ボタン / Enter で URL に反映されるまで API に渡さない。
 */
export function DashboardPage() {
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  // 適用済みのクエリ（API に反映されている条件）。URL から導出するので二重管理しない。
  const appliedQuery = useMemo(
    () => parseQueryParams(location.search),
    [location.search],
  );
  // 入力中のクエリ（検索ボタンを押すまで API には渡さない）
  const [draftQuery, setDraftQuery] = useState<BookListQuery>(appliedQuery);

  const { books, loading, errorCode, isFetched, refresh } =
    useBooks(appliedQuery);

  // エラーメッセージの取得
  const errorMessage = errorCode ? BOOK_LIST_ERROR_MESSAGES[errorCode] : null;

  // URL が変わったら（検索・クリア・戻る/進む）入力欄も URL の条件に合わせる。
  useEffect(() => {
    setDraftQuery(appliedQuery);
  }, [appliedQuery]);

  /**
   * 検索フォームの送信（「検索」ボタン / 入力欄での Enter）時の処理。
   * - 入力中の条件を page=1 に戻して URL に反映する（URL の変更が検索の実行になる）
   * - 条件が現在と同じなら URL は変えず、同じ条件で再取得だけ行う
   *   （履歴が重複しないようにするため）
   * @param event - フォーム送信イベント（ページ遷移を防ぐために preventDefault する）
   */
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 新しい検索は常に 1 ページ目から始める。
    const nextParams = buildSearchParams({ ...draftQuery, page: 1 });

    if (nextParams.toString() === buildSearchParams(appliedQuery).toString()) {
      void refresh();
      return;
    }

    setSearchParams(nextParams);
  };

  /**
   * 「クリア」ボタンの処理。入力欄と URL を初期状態に戻す。
   * URL がすでに空の場合は URL の変更が起きないため、入力欄は明示的に戻す。
   */
  const handleClear = () => {
    setDraftQuery(INITIAL_QUERY);

    if (location.search !== "") {
      setSearchParams({});
    }
  };

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

      {/* form にすることで、入力欄での Enter でも検索できる（IME 変換中の Enter は送信されない） */}
      <form
        role="search"
        aria-label="書籍検索"
        onSubmit={handleSearch}
        className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 sm:p-6 mb-6 space-y-4"
      >
        {/* 検索入力フィールド */}
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
          <label htmlFor="search-input" className="sr-only">
            検索
          </label>
          <input
            id="search-input"
            type="text"
            value={draftQuery.keyword}
            onChange={(e) =>
              setDraftQuery({
                ...draftQuery,
                keyword: e.target.value,
              })
            }
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
              value={draftQuery.ratingMin ?? ""}
              onChange={(e) =>
                setDraftQuery({
                  ...draftQuery,
                  ratingMin: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className="min-w-[180px] py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
            >
              <option value="">すべて</option>
              <option value="1">★1以上</option>
              <option value="2">★2以上</option>
              <option value="3">★3以上</option>
              <option value="4">★4以上</option>
              <option value="5">★5以上</option>
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
                value={draftQuery.publicationYearFrom ?? ""}
                onChange={(e) =>
                  setDraftQuery({
                    ...draftQuery,
                    publicationYearFrom: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                aria-label="出版年 From"
                className="w-[110px] py-2 px-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-slate-700 rounded focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
              />
              <span className="text-gray-500 dark:text-gray-400">〜</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="to"
                value={draftQuery.publicationYearTo ?? ""}
                onChange={(e) =>
                  setDraftQuery({
                    ...draftQuery,
                    publicationYearTo: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
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
              value={`${draftQuery.sort}-${draftQuery.order}`}
              onChange={(e) => {
                const { sort, order } = parseSortOrderValue(e.target.value);

                setDraftQuery({
                  ...draftQuery,
                  sort,
                  order,
                });
              }}
              className="min-w-[220px] py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ボタングループ（右下） */}
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={handleClear}
            type="button"
            data-testid="clear-filters-button"
            className="py-2 px-4 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded font-semibold text-sm hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition whitespace-nowrap"
          >
            クリア
          </button>
          <button
            type="submit"
            data-testid="search-button"
            className="py-2 px-5 bg-gray-900 border border-black/20 rounded font-semibold text-sm hover:bg-gray-800 active:scale-95 transition whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            検索
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 overflow-y-auto">
        {/* loading 中はローディング表示 */}
        {loading && (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              Loading...（読み込み中）
            </p>
          </div>
        )}
        {/* エラー時も検索フォームは残し、条件の変更・クリアで復帰できるようにする */}
        {!loading && errorMessage && (
          <div role="alert" className="col-span-full text-center py-10">
            <p className="text-red-600 dark:text-red-400">
              Error: {errorMessage}
            </p>
          </div>
        )}
        {!loading && !errorMessage && isFetched && books.length === 0 && (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              書籍が見つかりませんでした。
            </p>
          </div>
        )}

        {!loading &&
          books.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              ratingDisplay={
                book.averageRating != null
                  ? String(book.averageRating)
                  : "評価なし"
              }
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
