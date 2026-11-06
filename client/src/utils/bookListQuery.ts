import type { BookListQuery } from "../types";

/** 出版年として受け付ける最小値 */
const MIN_PUBLICATION_YEAR = 1;
/** 評価フィルタの最大値（★5） */
const MAX_RATING = 5;

/** URL 未指定時やクリア時に戻す検索条件の既定値 */
export const INITIAL_QUERY: BookListQuery = {
  page: 1,
  limit: 20,
  keyword: "",
  sort: "createdAt",
  order: "desc",
};

/** UI と URL が受け入れる並び替えキー */
const allowedSortValues = [
  "title",
  "author",
  "publicationYear",
  "rating",
  "createdAt",
] as const;
export type SortValue = (typeof allowedSortValues)[number];

/** UI と URL が受け入れる並び順 */
const allowedOrderValues = ["asc", "desc"] as const;
export type OrderValue = (typeof allowedOrderValues)[number];

/**
 * sort パラメータを安全に解釈する。
 * @param value - URL や UI から受け取った文字列
 * @returns 許可済みの値ならそのまま、そうでなければ `createdAt`
 * @example
 * parseSort("title"); // => "title"
 * parseSort("price"); // => "createdAt"（未許可の値は既定値へ丸める）
 */
export function parseSort(value: string | null): SortValue {
  return value !== null && allowedSortValues.includes(value as SortValue)
    ? (value as SortValue)
    : "createdAt";
}

/**
 * order パラメータを安全に解釈する。
 * @param value - URL や UI から受け取った文字列
 * @returns 許可済みの値ならそのまま、そうでなければ `desc`
 * @example
 * parseOrder("asc"); // => "asc"
 * parseOrder("up"); // => "desc"（未許可の値は既定値へ丸める）
 */
export function parseOrder(value: string | null): OrderValue {
  return value !== null && allowedOrderValues.includes(value as OrderValue)
    ? (value as OrderValue)
    : "desc";
}

/**
 * sort-order セレクトの複合値を sort と order に分解する。
 * `split()` の結果に undefined が含まれる可能性も既定値へ丸めて吸収する。
 * @param value - `"createdAt-desc"` のような複合値
 * @returns 安全な sort / order の組み合わせ
 * @example
 * parseSortOrderValue("title-asc"); // => { sort: "title", order: "asc" }
 * parseSortOrderValue("broken"); // => { sort: "createdAt", order: "desc" }
 */
export function parseSortOrderValue(value: string): {
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
 * page / limit のような「1 以上の整数」だけを受け付けて解釈する。
 * @param value - URL から取得した文字列
 * @param fallback - 未指定・不正値のときに返す値
 * @returns 1 以上の整数。それ以外は fallback
 */
function parsePositiveIntegerParam(
  value: string | null,
  fallback: number,
): number {
  if (value === null || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * ratingMin や publicationYear のような「範囲付きの任意整数」を解釈する。
 * @param value - URL から取得した文字列
 * @param minimum - 許容する最小値
 * @param maximum - 許容する最大値（省略時は上限なし）
 * @returns 範囲内の整数。未指定・不正値は undefined
 */
function parseOptionalIntegerParam(
  value: string | null,
  minimum: number,
  maximum?: number,
): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    return undefined;
  }

  return maximum === undefined || parsed <= maximum ? parsed : undefined;
}

/**
 * URL クエリ文字列を画面用の BookListQuery に変換する。
 * 不正な数値や未許可の sort / order は安全な既定値へ丸める。
 * @param search - `location.search` から受け取るクエリ文字列
 * @returns 画面初期化と API 呼び出しに使う検索条件
 * @example
 * parseQueryParams("?keyword=react&ratingMin=4&sort=title&order=asc");
 * // => { page: 1, limit: 20, keyword: "react", ratingMin: 4, sort: "title", order: "asc", ... }
 * parseQueryParams("?ratingMin=99"); // => ratingMin は undefined（範囲外は無視）
 */
export function parseQueryParams(search: string): BookListQuery {
  const params = new URLSearchParams(search);

  return {
    ...INITIAL_QUERY,
    keyword: params.get("keyword") ?? "",
    page: parsePositiveIntegerParam(
      params.get("page"),
      INITIAL_QUERY.page ?? 1,
    ),
    limit: parsePositiveIntegerParam(
      params.get("limit"),
      INITIAL_QUERY.limit ?? 20,
    ),
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

/**
 * BookListQuery を URLSearchParams に変換する（`parseQueryParams` の逆変換）。
 * 空文字や undefined は URL に載せず、共有しやすいクエリだけを残す。
 * @param query - 検索条件
 * @returns URL に反映する URLSearchParams
 * @example
 * buildSearchParams({ keyword: "react", ratingMin: 4, sort: "title", order: "asc" }).toString();
 * // => "keyword=react&ratingMin=4&sort=title&order=asc"
 */
export function buildSearchParams(query: BookListQuery): URLSearchParams {
  const params = new URLSearchParams();

  const entries: Array<[string, string | number | undefined]> = [
    ["keyword", query.keyword],
    ["ratingMin", query.ratingMin],
    ["publicationYearFrom", query.publicationYearFrom],
    ["publicationYearTo", query.publicationYearTo],
    ["sort", query.sort],
    ["order", query.order],
    ["page", query.page],
    ["limit", query.limit],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return params;
}
