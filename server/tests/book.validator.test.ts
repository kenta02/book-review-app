import type { Request } from 'express';
import { describe, expect, it } from 'vitest';

import {
  validateCreateBook,
  validateDeleteBook,
  validateGetBook,
  validateListBookReviews,
  validateListBooksQuery,
  validateUpdateBook,
} from '../src/validators/book.validator';

/**
 * validator テスト用に最小構成の Request オブジェクトを作る。
 *
 * @param input - params, query, body の任意セット
 * @returns Request 互換オブジェクト
 */
function makeRequest({
  params = {},
  query = {},
  body = {},
}: {
  params?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
} = {}): Request {
  return {
    params,
    query,
    body,
  } as unknown as Request;
}

describe('book.validator', () => {
  describe('validateListBooksQuery', () => {
    it('fills default page and limit when omitted', () => {
      // query 未指定時の既定値が崩れていないことを固定する。
      const result = validateListBooksQuery(makeRequest());

      expect(result).toEqual({
        success: true,
        data: { page: 1, limit: 20 },
      });
    });

    it('parses page and limit as numbers', () => {
      // 文字列 query が数値へ正規化されることを確認する。
      const result = validateListBooksQuery(
        makeRequest({
          query: { page: '3', limit: '15' },
        })
      );

      expect(result).toEqual({
        success: true,
        data: { page: 3, limit: 15 },
      });
    });

    it.each([
      [{ page: '0' }, 'page'],
      [{ page: '-1' }, 'page'],
      [{ page: '1.5' }, 'page'],
      [{ limit: '0' }, 'limit'],
      [{ limit: '-5' }, 'limit'],
      [{ limit: '2.5' }, 'limit'],
    ])('fails when pagination query is invalid: %o', (query, field) => {
      const result = validateListBooksQuery(
        makeRequest({
          query,
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([expect.objectContaining({ field })]);
      }
    });
  });

  describe('validateGetBook', () => {
    it('returns bookId for a valid id', () => {
      // path param の id が bookId へ変換されることを確認する。
      const result = validateGetBook(makeRequest({ params: { id: '42' } }));

      expect(result).toEqual({
        success: true,
        data: { bookId: 42 },
      });
    });

    it.each(['0', '-1', 'abc'])('fails for invalid id %s', (id) => {
      // get/delete/update で共有する INVALID_BOOK_ID 判定の基準を固定する。
      const result = validateGetBook(makeRequest({ params: { id } }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({
            field: 'id',
            code: 'INVALID_BOOK_ID',
          }),
        ]);
      }
    });
  });

  describe('validateCreateBook', () => {
    it('accepts a valid payload', () => {
      // 必須項目が埋まっていれば補助項目込みでそのまま通る。
      const result = validateCreateBook(
        makeRequest({
          body: {
            title: 'Domain-Driven Design',
            author: 'Eric Evans',
            publicationYear: 2003,
            ISBN: '9780321125217',
            summary: 'blue book',
          },
        })
      );

      expect(result).toEqual({
        success: true,
        data: {
          title: 'Domain-Driven Design',
          author: 'Eric Evans',
          publicationYear: 2003,
          ISBN: '9780321125217',
          summary: 'blue book',
        },
      });
    });

    it('fails when title is empty', () => {
      // 空文字は未入力と同様に扱う。
      const result = validateCreateBook(
        makeRequest({
          body: { title: '', author: 'author' },
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({ field: 'title' }),
        ]);
      }
    });

    it('fails when author is empty', () => {
      const result = validateCreateBook(
        makeRequest({
          body: { title: 'title', author: '' },
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({ field: 'author' }),
        ]);
      }
    });

    it('returns multiple errors when title and author are both invalid', () => {
      // create では複数の必須エラーをまとめて返せることを確認する。
      const result = validateCreateBook(
        makeRequest({
          body: { title: '   ', author: '' },
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(2);
        expect(result.errors.map((error) => error.field)).toEqual(['title', 'author']);
      }
    });
  });

  describe('validateUpdateBook', () => {
    it('fails with INVALID_BOOK_ID when id is invalid', () => {
      // update は body より先に id を落とし、service へ流さない前提を固定する。
      const result = validateUpdateBook(
        makeRequest({
          params: { id: '0' },
          body: { title: 'updated' },
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({
            field: 'id',
            code: 'INVALID_BOOK_ID',
          }),
        ]);
      }
    });

    it('accepts a partial update payload', () => {
      // 部分更新なので、未指定項目は undefined のまま許容する。
      const result = validateUpdateBook(
        makeRequest({
          params: { id: '7' },
          body: { summary: 'updated summary' },
        })
      );

      expect(result).toEqual({
        success: true,
        data: {
          bookId: 7,
          title: undefined,
          author: undefined,
          publicationYear: undefined,
          ISBN: undefined,
          summary: 'updated summary',
        },
      });
    });

    it('fails when title is provided as an empty string', () => {
      const result = validateUpdateBook(
        makeRequest({
          params: { id: '7' },
          body: { title: '' },
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({ field: 'title' }),
        ]);
      }
    });

    it('fails when author is provided as an empty string', () => {
      const result = validateUpdateBook(
        makeRequest({
          params: { id: '7' },
          body: { author: '' },
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({ field: 'author' }),
        ]);
      }
    });
  });

  describe('validateListBookReviews', () => {
    it('fills default pagination for a valid bookId', () => {
      // 書籍レビュー一覧も books 一覧と同じ既定ページングを使う。
      const result = validateListBookReviews(
        makeRequest({
          params: { bookId: '9' },
        })
      );

      expect(result).toEqual({
        success: true,
        data: { bookId: 9, page: 1, limit: 20 },
      });
    });

    it('normalizes bookId, page, and limit', () => {
      // path param と query の両方が正規化されることを確認する。
      const result = validateListBookReviews(
        makeRequest({
          params: { bookId: '9' },
          query: { page: '2', limit: '5' },
        })
      );

      expect(result).toEqual({
        success: true,
        data: { bookId: 9, page: 2, limit: 5 },
      });
    });

    it.each([
      [{ page: '0' }, 'page'],
      [{ page: '-1' }, 'page'],
      [{ limit: '0' }, 'limit'],
      [{ limit: '-5' }, 'limit'],
    ])('fails when review pagination query is invalid: %o', (query, field) => {
      const result = validateListBookReviews(
        makeRequest({
          params: { bookId: '9' },
          query,
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([expect.objectContaining({ field })]);
      }
    });

    it('fails when bookId is invalid', () => {
      const result = validateListBookReviews(
        makeRequest({
          params: { bookId: 'abc' },
        })
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({
            field: 'bookId',
            code: 'INVALID_BOOK_ID',
          }),
        ]);
      }
    });
  });

  describe('validateDeleteBook', () => {
    it('returns bookId for a valid id', () => {
      // delete 用 validator が get と同じ bookId 形式を返すことを確認する。
      const result = validateDeleteBook(makeRequest({ params: { id: '12' } }));

      expect(result).toEqual({
        success: true,
        data: { bookId: 12 },
      });
    });

    it.each(['0', '-1', 'abc'])('uses the same id validation for invalid id %s', (id) => {
      const result = validateDeleteBook(makeRequest({ params: { id } }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toEqual([
          expect.objectContaining({
            field: 'id',
            code: 'INVALID_BOOK_ID',
          }),
        ]);
      }
    });
  });
});
