import { describe, expect, it } from "vitest";
import type { BookListQuery } from "../types";
import {
  INITIAL_QUERY,
  buildSearchParams,
  parseOrder,
  parseQueryParams,
  parseSort,
  parseSortOrderValue,
} from "./bookListQuery";

describe("parseSort / parseOrder", () => {
  it("許可済みの値はそのまま返す", () => {
    expect(parseSort("title")).toBe("title");
    expect(parseOrder("asc")).toBe("asc");
  });

  it("未許可・null は既定値に丸める", () => {
    expect(parseSort("price")).toBe("createdAt");
    expect(parseSort(null)).toBe("createdAt");
    expect(parseOrder("up")).toBe("desc");
    expect(parseOrder(null)).toBe("desc");
  });
});

describe("parseSortOrderValue", () => {
  it("複合値を sort と order に分解する", () => {
    expect(parseSortOrderValue("publicationYear-asc")).toEqual({
      sort: "publicationYear",
      order: "asc",
    });
  });

  it("不正な複合値は既定値に丸める", () => {
    expect(parseSortOrderValue("broken")).toEqual({
      sort: "createdAt",
      order: "desc",
    });
  });
});

describe("parseQueryParams", () => {
  it("空のクエリ文字列は既定値になる", () => {
    expect(parseQueryParams("")).toEqual(INITIAL_QUERY);
  });

  it("各条件を URL から復元する", () => {
    expect(
      parseQueryParams(
        "?keyword=react&ratingMin=4&publicationYearFrom=2000&publicationYearTo=2020&sort=title&order=asc&page=2&limit=10",
      ),
    ).toEqual({
      keyword: "react",
      ratingMin: 4,
      publicationYearFrom: 2000,
      publicationYearTo: 2020,
      sort: "title",
      order: "asc",
      page: 2,
      limit: 10,
    });
  });

  it("不正な数値は無視し、既定値に丸める", () => {
    const query = parseQueryParams(
      "?page=0&limit=-1&ratingMin=4.4&publicationYearFrom=-2000&publicationYearTo=abc",
    );

    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
    expect(query.ratingMin).toBeUndefined();
    expect(query.publicationYearFrom).toBeUndefined();
    expect(query.publicationYearTo).toBeUndefined();
  });

  it("評価の範囲外（6 以上）は無視する", () => {
    expect(parseQueryParams("?ratingMin=6").ratingMin).toBeUndefined();
    expect(parseQueryParams("?ratingMin=5").ratingMin).toBe(5);
  });
});

describe("buildSearchParams", () => {
  it("空文字・undefined は URL に載せない", () => {
    const params = buildSearchParams({
      keyword: "",
      ratingMin: undefined,
      sort: "title",
      order: "asc",
    });

    expect(params.toString()).toBe("sort=title&order=asc");
  });

  it("日本語キーワードをエンコードして往復できる", () => {
    const params = buildSearchParams({ keyword: "設計 入門" });

    expect(params.toString()).toBe(
      "keyword=%E8%A8%AD%E8%A8%88+%E5%85%A5%E9%96%80",
    );
    expect(parseQueryParams(`?${params.toString()}`).keyword).toBe("設計 入門");
  });

  it("build → parse で同じ条件に戻る（リロード後も同じ条件）", () => {
    const query: BookListQuery = {
      page: 3,
      limit: 50,
      keyword: "TypeScript",
      ratingMin: 3,
      publicationYearFrom: 2010,
      publicationYearTo: 2024,
      sort: "rating",
      order: "asc",
    };

    expect(parseQueryParams(`?${buildSearchParams(query).toString()}`)).toEqual(
      query,
    );
  });
});
