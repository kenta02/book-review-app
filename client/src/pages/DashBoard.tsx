import { MainLayout } from "../components/layouts/MainLayout";
import { BookCard } from "../components/BookCard";
import { BOOK_LIST_ERROR_MESSAGES } from "../constants/messages";
import { useBooks } from "../hooks/useBooks";
import { useEffect, useState } from "react";
import type { BookListQuery } from "../types";
import { useLocation, useSearchParams } from "react-router-dom";

const MIN_PUBLICATION_YEAR = 1;
const MAX_RATING = 5;
// URL 未指定時やクリア時に戻す検索条件の既定値
const INITIAL_QUERY: BookListQuery = {
  page: 1,
  limit: 20,
  keyword: "",
  sort: "createdAt",
  order: "desc",
};

// UI と URL が受け入れる並び替えキーを列挙する
const allowedSortValues = [
  "title",
  "author",
  "publicationYear",
  "rating",
  "createdAt",
] as const;

type SortValue = (typeof allowedSortValues)[number];

const allowedOrderValues = ["asc", "desc"] as const;
type OrderValue = (typeof allowedOrderValues)[number];

/**
 * sort パラメータが許可済みの値かを判定する。
 * @param value - URL や UI から受け取った文字列
 * @returns 許可済みの sort 値であれば true
 */
const isValidSort = (value: string | null): value is SortValue => {
  return value !== null && allowedSortValues.includes(value as SortValue);
};

/**
 * order パラメータが許可済みの値かを判定する。
 * @param value - URL や UI から受け取った文字列
 * @returns 許可済みの order 値であれば true
 */
const isValidOrder = (value: string | null): value is OrderValue => {
  return value !== null && allowedOrderValues.includes(value as OrderValue);
};

/**
 * sort パラメータを安全に既定値付きで解釈する。
 * @param value - URL から取得した sort 値
 * @returns 有効な sort 値。無効時は `createdAt`
 */
const parseSort = (value: string | null): SortValue => {
  return isValidSort(value) ? value : "createdAt";
};

/**
 * order パラメータを安全に既定値付きで解釈する。
 * @param value - URL から取得した order 値
 * @returns 有効な order 値。無効時は `desc`
 */
const parseOrder = (value: string | null): OrderValue => {
  return isValidOrder(value) ? value : "desc";
};

/**
 * sort-order セレクトの値を sort と order に分解して正規化する。
 * `split()` の結果に undefined が含まれる可能性を吸収し、既定値へ丸める。
 * @param value - `"createdAt-desc"` のような複合値
 * @returns 安全な sort / order の組み合わせ
 */
function parseSortOrderValue(value: string): {
  sort: SortValue;
  order: OrderValue;
} {
  const [rawSort, rawOrder] = value.split("-", 2);

  return {
    sort: parseSort(rawSort ?? null),
    order: parseOrder(rawOrder ?? null),
  };
}

/**
 * URL クエリ文字列を画面用の BookListQuery に変換する。
 * 不正な数値や未許可の sort/order は安全な既定値へ丸める。
 * @param search - `location.search` から受け取るクエリ文字列
 * @returns 画面初期化に使う検索条件
 */
function parseQueryParams(search: string): BookListQuery {
  const params = new URLSearchParams(search);

  // page / limit のような正の整数だけを受け付ける。
  const parsePositiveIntegerParam = (
    value: string | null,
    fallback: number,
  ): number => {
    if (value === null || value.trim() === "") {
      return fallback;
    }

    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }

    return fallback;
  };

  // rating や publicationYear のような範囲付き整数を安全に解釈する。
  const parseOptionalIntegerParam = (
    value: string | null,
    minimum: number,
    maximum?: number,
  ): number | undefined => {
    if (value === null || value.trim() === "") {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      return undefined;
    }

    if (parsed < minimum) {
      return undefined;
    }

    if (maximum === undefined || parsed <= maximum) {
      return parsed;
    }

    return undefined;
  };

  return {
    ...INITIAL_QUERY,
    keyword: params.get("keyword") ?? "",
    page: parsePositiveIntegerParam(params.get("page"), 1),
    limit: parsePositiveIntegerParam(params.get("limit"), 20),
    ratingMin: parseOptionalIntegerParam(
      params.get("ratingMin"),
      1,
      MAX_RATING,
    ),
    publicationYearFrom: parseOptionalIntegerParam(
      params.get("publicationYearFrom"),
      MIN_PUBLICATION_YEAR,
    ),
    publicationYearTo: parseOptionalIntegerParam(
      params.get("publicationYearTo"),
      MIN_PUBLICATION_YEAR,
    ),
    sort: parseSort(params.get("sort")),
    order: parseOrder(params.get("order")),
  };
}

export function DashboardPage() {
  // 入力中のクエリ
  const [draftQuery, setDraftQuery] = useState<BookListQuery>(INITIAL_QUERY);
  // 適用済みのクエリ（APIに反映されているクエリ）
  const [appliedQuery, setAppliedQuery] =
    useState<BookListQuery>(INITIAL_QUERY);

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

    // 空文字や undefined は URL に載せず、共有しやすいクエリだけを残す。
    const setParam = (key: string, value: string | number | undefined) => {
      if (value === undefined || value === "") {
        return;
      }

        params.set(key, String(value));
    };

    const queryEntries: Array<[string, string | number | undefined]> = [
      ["keyword", query.keyword],
      ["ratingMin", query.ratingMin],
      ["publicationYearFrom", query.publicationYearFrom],
      ["publicationYearTo", query.publicationYearTo],
      ["sort", query.sort],
      ["order", query.order],
      ["page", query.page],
      ["limit", query.limit],
    ];

    queryEntries.forEach(([key, value]) => {
      setParam(key, value);
    });

    return params;
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

  useEffect(() => {
    // URL 直打ちや戻る/進む操作でも画面状態を復元する。
    const queryFromUrl = parseQueryParams(location.search);
    setDraftQuery(queryFromUrl);
    setAppliedQuery(queryFromUrl);
  }, [location.search]);

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
            onClick={() => {
              setSearchParams({});
              setAppliedQuery(INITIAL_QUERY);
              setDraftQuery(INITIAL_QUERY);
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
