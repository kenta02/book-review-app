import { MainLayout } from "../components/layouts/MainLayout";
import { BookCard } from "../components/BookCard";
import { BOOK_LIST_ERROR_MESSAGES } from "../constants/messages";
import { useBooks } from "../hooks/useBooks";
import { useEffect, useState } from "react";
import type { BookListQuery } from "../types";
import { useLocation, useSearchParams } from "react-router-dom";

export function DashboardPage() {
  // クエリの初期値を定義する
  const initialQuery: BookListQuery = {
    page: 1,
    limit: 20,
    keyword: "",
    author: "",
    sort: "createdAt",
    order: "desc",
  };

  // 入力中のクエリ
  const [draftQuery, setDraftQuery] = useState<BookListQuery>(initialQuery);
  // 適用済みのクエリ（APIに反映されているクエリ）
  const [appliedQuery, setAppliedQuery] = useState<BookListQuery>(initialQuery);

  // hooksの戻り値から書籍データと状態を取得するために定義
  const { books, loading, errorCode, isFetched } = useBooks(appliedQuery);

  // エラーメッセージの取得
  const errorMessage = errorCode ? BOOK_LIST_ERROR_MESSAGES[errorCode] : null;

  // URLクエリを更新する
  const location = useLocation();

  // クエリを初期化
  const [, setSearchParams] = useSearchParams();

  /**
   *  クエリオブジェクトをURLSearchParamsに変換する
   * @param query:BookListQueryオブジェクト
   * @returns params: URLSearchParamsオブジェクト
   */
  const buildSearchParams = (query: BookListQuery) => {
    const params = new URLSearchParams();

    const setparam = (key: string, value: string | number | undefined) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    };

    if (query.keyword) setparam("keyword", query.keyword);
    if (query.author) setparam("author", query.author);
    if (query.ratingMin) setparam("ratingMin", query.ratingMin);
    if (query.publicationYearFrom !== undefined) {
      setparam("publicationYearFrom", query.publicationYearFrom);
    }
    if (query.publicationYearTo !== undefined) {
      setparam("publicationYearTo", query.publicationYearTo);
    }
    if (query.sort) {
      setparam("sort", query.sort);
    }
    if (query.order) {
      setparam("order", query.order);
    }
    if (query.page) {
      setparam("page", query.page);
    }
    if (query.limit) {
      setparam("limit", query.limit);
    }
    return params;
  };

  // URLクエリから数値を安全にパースする
  const parseNumberParam = (value: string | null, fallback: number): number => {
    if (value === null || value.trim() === "") {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  /**
   * 検索ボタンがクリックされたときの処理
   * - 入力中のクエリを適用済みのクエリにコピーする
   * - URLクエリを更新する
   */
  const handleSearch = () => {
    // draftQueryをURLクエリに変換する
    const params = buildSearchParams(draftQuery);
    // クエリを適用する
    setAppliedQuery(draftQuery);
    // URLクエリを更新する
    setSearchParams(params);
  };

  // location.searchのクエリパラメータを解析して、クエリオブジェクトに変換する
  const parseQueryParams = (search: string): BookListQuery => {
    const params = new URLSearchParams(search);
    const query: BookListQuery = {
      ...initialQuery,
      keyword: params.get("keyword") ?? "",
      author: params.get("author") ?? "",
      page: parseNumberParam(params.get("page"), 1),
      limit: parseNumberParam(params.get("limit"), 20),
      ratingMin: params.get("ratingMin")
        ? Number(params.get("ratingMin"))
        : undefined,
      publicationYearFrom: params.get("publicationYearFrom")
        ? Number(params.get("publicationYearFrom"))
        : undefined,
      publicationYearTo: params.get("publicationYearTo")
        ? Number(params.get("publicationYearTo"))
        : undefined,
      sort: (params.get("sort") as BookListQuery["sort"]) ?? "createdAt",
      order: (params.get("order") as BookListQuery["order"]) ?? "desc",
    };

    // 結果をdraftQueryとappliedQueryの両方に反映するために、クエリオブジェクトを返す
    return query;
  };

  useEffect(() => {
    const queryFromUrl = parseQueryParams(location.search);
    setDraftQuery(queryFromUrl);
    setAppliedQuery(queryFromUrl);
  }, [location.search]);

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
                const mapping = {
                  "rating-desc": { sort: "rating", order: "desc" } as const,
                  "createdAt-desc": {
                    sort: "createdAt",
                    order: "desc",
                  } as const,
                  "title-asc": { sort: "title", order: "asc" } as const,
                  "author-asc": { sort: "author", order: "asc" } as const,
                  "publicationYear-desc": {
                    sort: "publicationYear",
                    order: "desc",
                  } as const,
                } as const;

                const { sort, order } = mapping[
                  e.target.value as keyof typeof mapping
                ] ?? { sort: "createdAt", order: "desc" };

                setDraftQuery({
                  ...draftQuery,
                  sort,
                  order,
                });
              }}
              className="min-w-[220px] py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
            >
              <option value="rating-desc">評価が高い順</option>
              <option value="createdAt-desc">登録日が新しい順</option>
              <option value="title-asc">タイトル順</option>
              <option value="author-asc">著者名順</option>
              <option value="publicationYear-desc">出版年が新しい順</option>
            </select>
          </div>
        </div>

        {/* ボタングループ（右下） */}
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={() => {
              setSearchParams({});
              setAppliedQuery(initialQuery);
              setDraftQuery(initialQuery);
            }}
            type="button"
            data-testid="clear-filters-button"
            className="py-2 px-4 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded font-semibold text-sm hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition whitespace-nowrap"
          >
            クリア
          </button>
          <button
            type="button"
            data-testid="search-button"
            onClick={handleSearch}
            className="py-2 px-5 bg-gray-900 border border-black/20 rounded font-semibold text-sm hover:bg-gray-800 active:scale-95 transition whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            検索
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 overflow-y-auto">
        {/* loading 中はローディング表示 */}
        {loading && (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              Loading...（読み込み中）
            </p>
          </div>
        )}
        {!loading && isFetched && books.length === 0 && (
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
                book.averageRating != null ? String(book.averageRating) : "0"
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
